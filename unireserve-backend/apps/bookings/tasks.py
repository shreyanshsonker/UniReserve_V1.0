from celery import shared_task
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from apps.bookings.models import Waitlist, Booking
from apps.facilities.models import FacilitySlot
from apps.notifications.tasks import create_system_notification

@shared_task
def process_waitlist_promotions(slot_id):
    """
    Called when a booking is cancelled. Promotes the next student(s) on the waitlist.
    """
    with transaction.atomic():
        try:
            slot = FacilitySlot.objects.select_for_update().get(id=slot_id)
        except FacilitySlot.DoesNotExist:
            return

        available = slot.available_capacity - slot.booked_count
        if available <= 0:
            return

        waitlisters = Waitlist.objects.filter(
            slot=slot, 
            status='WAITING'
        ).order_by('position')[:available]

        for entry in waitlisters:
            req_approval = slot.facility.requires_approval
            status = 'PENDING' if req_approval else 'CONFIRMED'
            
            booking = Booking.objects.create(
                student=entry.student,
                facility=entry.facility,
                slot=slot,
                status=status,
                approval_status='PENDING' if req_approval else None,
                group_size=1,
                purpose="Promoted from waitlist"
            )

            entry.status = 'PROMOTED'
            entry.promoted_at = timezone.now()
            entry.save(update_fields=['status', 'promoted_at'])

            slot.booked_count += 1
            slot.save(update_fields=['booked_count'])

            create_system_notification.delay(
                user_id=entry.student.id,
                type_choice='WAITLIST_PROMOTED',
                title='Waitlist Promotion Success',
                body=f'Good news! A slot opened up and you have been promoted for {slot.facility.name}.',
                booking_id=booking.id
            )

@shared_task
def detect_no_shows():
    """
    Scans for CONFIRMED bookings past their check-in grace period and marks them NO_SHOW.
    """
    now = timezone.now()
    # Find bookings where slot_date == today and start_time < now - 15 mins
    # And checked_in_at IS NULL
    # For robust timezone handling, we construct slot datetimes
    today = now.date()
    
    # Roughly: get confirmed bookings for today where they are 15 mins late
    bookings = Booking.objects.filter(
        status='CONFIRMED',
        checked_in_at__isnull=True,
        slot__slot_date__lte=today
    )
    
    for booking in bookings:
        slot_dt = timezone.make_aware(timezone.datetime.combine(booking.slot.slot_date, booking.slot.start_time))
        grace_period = slot_dt + timedelta(minutes=15)
        
        if now > grace_period:
            with transaction.atomic():
                b = Booking.objects.select_for_update().get(id=booking.id)
                if b.status == 'CONFIRMED' and not b.checked_in_at:
                    b.status = 'NO_SHOW'
                    b.save(update_fields=['status'])
                    
                    student = b.student
                    student.no_show_count += 1
                    
                    # Rule evaluation fallback (default 3)
                    if student.no_show_count >= 3:
                        student.is_banned = True
                        student.ban_until = timezone.now() + timedelta(days=7)
                        student.save(update_fields=['no_show_count', 'is_banned', 'ban_until'])
                        
                        create_system_notification.delay(
                            user_id=student.id,
                            type_choice='BAN_WARNING',
                            title='Account Temporarily Suspended',
                            body='You have accumulated too many no-shows. Your booking privileges are suspended for 7 days.',
                        )
                    elif student.no_show_count == 2:
                        student.save(update_fields=['no_show_count'])
                        create_system_notification.delay(
                            user_id=student.id,
                            type_choice='BAN_WARNING',
                            title='Warning: High No-Show Rate',
                            body='You have 2 no-shows. One more will result in a 7-day booking ban.',
                        )
                    else:
                        student.save(update_fields=['no_show_count'])
                        create_system_notification.delay(
                            user_id=student.id,
                            type_choice='NO_SHOW_RECORDED',
                            title='No-Show Recorded',
                            body=f'A no-show has been recorded for your booking at {booking.facility.name}.',
                            booking_id=booking.id
                        )

@shared_task
def expire_waitlist_entries():
    """
    Marks waitlist entries EXPIRED if the slot start time has passed.
    """
    now = timezone.now()
    expired = Waitlist.objects.filter(status='WAITING', expires_at__lt=now)
    expired.update(status='EXPIRED')

@shared_task
def send_booking_reminders():
    """
    Sends reminders for CONFIRMED bookings coming up in the next hour.
    """
    now = timezone.now()
    one_hour_later = now + timedelta(hours=1)
    
    # We find slots starting between now and one_hour_later
    bookings = Booking.objects.filter(
        status='CONFIRMED',
        slot__slot_date=now.date(),
        slot__start_time__gte=now.time(),
        slot__start_time__lte=one_hour_later.time()
    )
    
    # Assuming we track sent reminders via a flag in a real app,
    # or just send for a tight 5-minute window via celery beat.
    # We'll dispatch notification
    for booking in bookings:
        create_system_notification.delay(
            user_id=booking.student.id,
            type_choice='REMINDER',
            title='Upcoming Booking Reminder',
            body=f'Your booking at {booking.facility.name} starts inside an hour.',
            booking_id=booking.id
        )
