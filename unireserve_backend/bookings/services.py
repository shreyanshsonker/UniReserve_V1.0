from django.db import IntegrityError, transaction
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError
from .models import Booking, BookingRule, Waitlist
from .notifications import EmailService
from facilities.models import FacilitySlot

class BookingService:
    SLOT_OCCUPYING_STATUSES = ['active', 'pending_approval', 'attended', 'no_show']
    APPROVED_STATUSES = ['active', 'attended', 'no_show']

    @staticmethod
    def get_rule_value(key, default):
        try:
            return BookingRule.objects.get(rule_key=key).value
        except BookingRule.DoesNotExist:
            return default

    @classmethod
    def sync_slot_bookings(cls, slot):
        reserved_count = Booking.objects.filter(
            slot=slot,
            status__in=cls.SLOT_OCCUPYING_STATUSES,
        ).count()

        if slot.current_bookings != reserved_count:
            slot.current_bookings = reserved_count
            slot.save(update_fields=['current_bookings'])

        return slot.current_bookings

    @classmethod
    def _promote_waitlist_if_possible(cls, slot):
        cls.sync_slot_bookings(slot)

        while slot.current_bookings < slot.capacity:
            next_in_line = Waitlist.objects.filter(slot=slot).order_by('created_at').first()
            if not next_in_line:
                break

            promoted_booking = Booking.objects.create(
                user=next_in_line.user,
                slot=slot,
                status='pending_approval',
            )
            next_in_line.delete()
            cls.sync_slot_bookings(slot)
            EmailService.send_waitlist_promotion(next_in_line.user, slot)
            EmailService.send_manager_booking_request(slot.facility.manager, next_in_line.user, slot)

        return slot

    @classmethod
    def validate_booking(cls, user, slot, is_waitlist=False):
        """
        Comprehensive validation of booking rules:
        1. User must not be suspended.
        2. Slot must be active and not blocked.
        3. Slot must have remaining capacity (if NOT waitlisting).
        4. User must not have reached daily limit (max 3).
        5. User must not have reached weekly hour limit (max 10).
        6. User must not already have an active booking for this slot.
        """
        # 0. Suspension Check
        if hasattr(user, 'check_suspension'):
            if user.check_suspension():
                expiry = user.suspended_until.strftime("%Y-%m-%d %H:%M") if user.suspended_until else "TBD"
                raise ValidationError(f"Your account is suspended due to no-shows until {expiry}.")

        # 1. Basic slot checks
        if slot.is_blocked:
            raise ValidationError("This slot is currently under maintenance.")
        
        if slot.date < timezone.now().date():
            raise ValidationError("Cannot book a slot in the past.")

        # 2. Capacity check (Only if not joined via waitlist promotion)
        if not is_waitlist and slot.current_bookings >= slot.capacity:
            raise ValidationError("This slot is already full. Please join the waitlist.")

        # 3. Double-booking check
        if Booking.objects.filter(user=user, slot=slot, status__in=['active', 'pending_approval']).exists():
            raise ValidationError("You already have an active or pending booking for this session.")

        # 4. Daily Limit Check (Max 3/day)
        max_daily = cls.get_rule_value('max_per_day', 3)
        daily_count = Booking.objects.filter(
            user=user, 
            slot__date=slot.date, 
            status__in=['active', 'pending_approval', 'attended']
        ).count()
        
        if daily_count >= max_daily:
            raise ValidationError(f"You've reached your daily booking limit ({max_daily}).")

        # 5. Weekly Hour Limit Check (Max 10h/week)
        max_weekly_hours = cls.get_rule_value('max_hours_per_week', 10)
        start_of_week = slot.date - timedelta(days=slot.date.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        weekly_bookings = Booking.objects.filter(
            user=user,
            slot__date__range=[start_of_week, end_of_week],
            status__in=['active', 'pending_approval', 'attended']
        ).select_related('slot')
        
        total_minutes = 0
        for b in weekly_bookings:
            duration = timezone.datetime.combine(b.slot.date, b.slot.end_time) - \
                       timezone.datetime.combine(b.slot.date, b.slot.start_time)
            total_minutes += duration.total_seconds() / 60
            
        new_duration = timezone.datetime.combine(slot.date, slot.end_time) - \
                       timezone.datetime.combine(slot.date, slot.start_time)
        new_minutes = new_duration.total_seconds() / 60
        
        if (total_minutes + new_minutes) > (max_weekly_hours * 60):
            raise ValidationError(f"Booking this would exceed your 10-hour weekly limit.")

        return True

    @classmethod
    @transaction.atomic
    def execute_booking(cls, user, slot):
        """
        Persists the booking as pending approval and reserves slot capacity atomically.
        """
        fresh_slot = FacilitySlot.objects.select_for_update().get(pk=slot.pk)
        cls.sync_slot_bookings(fresh_slot)
        cls.validate_booking(user, fresh_slot)

        try:
            booking = Booking.objects.create(
                user=user,
                slot=fresh_slot,
                status='pending_approval'
            )
        except IntegrityError:
            existing_booking = Booking.objects.filter(
                user=user,
                slot=fresh_slot,
            ).exclude(
                status__in=['active', 'pending_approval'],
            ).order_by('-updated_at', '-created_at').first()

            if not existing_booking:
                raise ValidationError("You already have an active or pending booking for this session.")

            existing_booking.status = 'pending_approval'
            existing_booking.checked_in_at = None
            existing_booking.manager_note = ''
            existing_booking.save(update_fields=['status', 'checked_in_at', 'manager_note', 'updated_at'])
            booking = existing_booking

        cls.sync_slot_bookings(fresh_slot)
        EmailService.send_booking_pending_approval(user, fresh_slot)
        EmailService.send_manager_booking_request(fresh_slot.facility.manager, user, fresh_slot)
        return booking

    @classmethod
    @transaction.atomic
    def join_waitlist(cls, user, slot):
        """
        Adds user to waitlist if slot is full.
        """
        fresh_slot = FacilitySlot.objects.select_for_update().get(pk=slot.pk)
        cls.sync_slot_bookings(fresh_slot)

        if hasattr(user, 'check_suspension') and user.check_suspension():
             raise ValidationError("Cannot join waitlist while suspended.")

        if fresh_slot.is_blocked:
            raise ValidationError("This slot is under maintenance.")
        
        if fresh_slot.current_bookings < fresh_slot.capacity:
            raise ValidationError("This slot is not full yet. You can book directly.")
            
        if Waitlist.objects.filter(user=user, slot=fresh_slot).exists():
            raise ValidationError("You are already on the waitlist for this slot.")

        if Booking.objects.filter(user=user, slot=fresh_slot, status__in=['active', 'pending_approval']).exists():
            raise ValidationError("You already have a booking for this session.")

        return Waitlist.objects.create(user=user, slot=fresh_slot)

    @classmethod
    @transaction.atomic
    def approve_booking(cls, booking, note=''):
        fresh_booking = Booking.objects.select_related(
            'slot__facility__manager',
            'user',
        ).select_for_update().get(pk=booking.pk)
        fresh_slot = FacilitySlot.objects.select_for_update().get(pk=fresh_booking.slot.pk)
        cls.sync_slot_bookings(fresh_slot)

        if fresh_booking.status != 'pending_approval':
            raise ValidationError("Only pending approval requests can be approved.")

        approved_count = Booking.objects.filter(
            slot=fresh_slot,
            status__in=cls.APPROVED_STATUSES,
        ).count()
        if approved_count >= fresh_slot.capacity:
            raise ValidationError("This slot is already full. Reject another request or free a seat first.")

        fresh_booking.status = 'active'
        fresh_booking.manager_note = note
        fresh_booking.save(update_fields=['status', 'manager_note', 'updated_at'])
        cls.sync_slot_bookings(fresh_slot)
        EmailService.send_booking_confirmation(fresh_booking.user, fresh_slot)
        return fresh_booking

    @classmethod
    @transaction.atomic
    def reject_booking(cls, booking, note=''):
        fresh_booking = Booking.objects.select_related(
            'slot__facility__manager',
            'user',
        ).select_for_update().get(pk=booking.pk)
        fresh_slot = FacilitySlot.objects.select_for_update().get(pk=fresh_booking.slot.pk)

        if fresh_booking.status != 'pending_approval':
            raise ValidationError("Only pending approval requests can be rejected.")

        fresh_booking.status = 'cancelled'
        fresh_booking.manager_note = note
        fresh_booking.save(update_fields=['status', 'manager_note', 'updated_at'])
        cls.sync_slot_bookings(fresh_slot)
        EmailService.send_booking_rejected(fresh_booking.user, fresh_slot, note)
        cls._promote_waitlist_if_possible(fresh_slot)
        return fresh_booking

    @classmethod
    @transaction.atomic
    def check_in(cls, booking):
        """
        Digital check-in within 15 mins of start time.
        """
        if booking.status != 'active':
            raise ValidationError("Can only check into active bookings.")
            
        now = timezone.now()
        slot_start = timezone.datetime.combine(booking.slot.date, booking.slot.start_time)
        if timezone.is_naive(slot_start):
            slot_start = timezone.make_aware(slot_start)
            
        if now < (slot_start - timedelta(minutes=5)): # Small buffer for early birds
            raise ValidationError(f"Too early! Check-in opens at {booking.slot.start_time}.")
            
        if now > (slot_start + timedelta(minutes=15)):
            raise ValidationError("Check-in window (15 mins) has passed.")
            
        booking.checked_in_at = now
        booking.status = 'attended'
        booking.save()
        return booking

    @classmethod
    @transaction.atomic
    def record_no_show(cls, booking):
        """
        Flags session as no-show and handles suspension at 3 warnings.
        """
        if booking.status != 'active' or booking.checked_in_at is not None:
            return booking

        booking.status = 'no_show'
        booking.save()
        
        user = booking.user
        user.no_show_count += 1
        
        if user.no_show_count >= 3:
            user.is_suspended = True
            user.suspended_until = timezone.now() + timedelta(days=7)
            EmailService.send_suspension_alert(user, user.suspended_until)
        else:
            EmailService.send_no_show_warning(user, booking)
            
        user.save(update_fields=['no_show_count', 'is_suspended', 'suspended_until'])
        return booking

    @classmethod
    @transaction.atomic
    def cancel_booking(cls, booking):
        """
        Cancels a booking and promotes from waitlist if possible.
        """
        if booking.status not in ['active', 'pending_approval']:
            raise ValidationError("Only active or pending bookings can be cancelled.")
            
        slot_datetime = timezone.datetime.combine(booking.slot.date, booking.slot.start_time)
        if timezone.is_naive(slot_datetime):
            slot_datetime = timezone.make_aware(slot_datetime)
            
        if timezone.now() > (slot_datetime - timedelta(minutes=30)):
            raise ValidationError("Cancellations must be made at least 30 minutes before the start time.")
            
        slot = FacilitySlot.objects.select_for_update().get(pk=booking.slot.pk)
        cls.sync_slot_bookings(slot)

        booking.status = 'cancelled'
        booking.save(update_fields=['status', 'updated_at'])
        cls.sync_slot_bookings(slot)
        EmailService.send_booking_cancellation(booking.user, booking.slot)

        cls._promote_waitlist_if_possible(slot)
        return booking
