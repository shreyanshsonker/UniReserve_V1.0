from django.db import transaction
from django.utils import timezone
from apps.bookings.models import Booking
from apps.facilities.models import FacilitySlot
from apps.core.exceptions import BusinessLogicException
from datetime import datetime

class BookingRuleEngine:
    @staticmethod
    def validate_rules(student, facility, slot_date):
        # Enforce NO_SHOW_BAN, MAX_BOOKINGS_PER_DAY, etc.
        # This is where we'd fetch from BookingRule model for facility overrides
        pass

@transaction.atomic
def create_booking(student, facility, slot_id, data):
    try:
        slot = FacilitySlot.objects.select_for_update().get(id=slot_id)
    except FacilitySlot.DoesNotExist:
        raise BusinessLogicException('Slot not found.', 'SLOT_NOT_FOUND', 404)

    if slot.is_blocked:
        raise BusinessLogicException('Slot is blocked.', 'SLOT_BLOCKED', 400)

    BookingRuleEngine.validate_rules(student, facility, slot.slot_date)

    group_size = data.get('group_size', 1)
    if slot.available_capacity - slot.booked_count < group_size:
        raise BusinessLogicException('Not enough capacity in the requested slot.', 'CAPACITY_EXCEEDED', 400)

    slot.booked_count += group_size
    slot.save(update_fields=['booked_count'])

    requires_approval = facility.requires_approval
    status = 'PENDING' if requires_approval else 'CONFIRMED'
    app_status = 'PENDING' if requires_approval else None

    booking = Booking.objects.create(
        student=student,
        facility=facility,
        slot=slot,
        status=status,
        approval_status=app_status,
        group_size=group_size,
        group_members=data.get('group_members'),
        purpose=data.get('purpose')
    )
    return booking

@transaction.atomic
def cancel_booking(student, booking_id, reason=None):
    try:
        booking = Booking.objects.select_for_update().get(id=booking_id, student=student)
    except Booking.DoesNotExist:
        raise BusinessLogicException('Booking not found.', 'NOT_FOUND', 404)

    if booking.status in ['CANCELLED', 'COMPLETED', 'NO_SHOW']:
        raise BusinessLogicException('Booking cannot be cancelled in its current state.', 'INVALID_TRANSITION', 400)

    booking.status = 'CANCELLED'
    booking.cancellation_reason = reason
    booking.cancelled_at = timezone.now()
    booking.save(update_fields=['status', 'cancellation_reason', 'cancelled_at'])

    slot = FacilitySlot.objects.select_for_update().get(id=booking.slot_id)
    slot.booked_count = max(0, slot.booked_count - booking.group_size)
    slot.save(update_fields=['booked_count'])

    from apps.bookings.tasks import process_waitlist_promotions
    process_waitlist_promotions.delay(slot.id)

    return booking

@transaction.atomic
def process_booking_approval(manager, booking_id, approve=True, rejection_reason=None):
    try:
        booking = Booking.objects.select_for_update().get(id=booking_id, approval_status='PENDING')
    except Booking.DoesNotExist:
        raise BusinessLogicException('Pending approval booking not found.', 'NOT_FOUND', 404)

    booking.approved_by = manager
    booking.approved_at = timezone.now()
    if approve:
        booking.approval_status = 'APPROVED'
        booking.status = 'CONFIRMED'
        booking.save(update_fields=['approval_status', 'status', 'approved_by', 'approved_at'])
    else:
        booking.approval_status = 'REJECTED'
        booking.status = 'CANCELLED'
        booking.rejection_reason = rejection_reason
        booking.save(update_fields=['approval_status', 'status', 'approved_by', 'approved_at', 'rejection_reason'])
        
        # Release capacity
        slot = FacilitySlot.objects.select_for_update().get(id=booking.slot_id)
        slot.booked_count = max(0, slot.booked_count - booking.group_size)
        slot.save(update_fields=['booked_count'])

    return booking

@transaction.atomic
def check_in_booking(student, booking_id):
    try:
        booking = Booking.objects.select_for_update().get(id=booking_id, student=student, status='CONFIRMED')
    except Booking.DoesNotExist:
        raise BusinessLogicException('Confirmed booking not found or already processed.', 'NOT_FOUND', 404)

    if booking.checked_in_at:
        raise BusinessLogicException('Already checked in.', 'ALREADY_CHECKED_IN', 400)

    # Future TODO: Enforce checking grace period rules based on BookingRule
    # (e.g. within 15 mins of slot_date start_time)
        
    booking.checked_in_at = timezone.now()
    # If completed right away or just marked as checked_in depends on logic, PRD just says checked_in_at for now.
    booking.save(update_fields=['checked_in_at'])
    return booking
