from django.db import transaction
from django.db.models import Max
from django.utils import timezone
from apps.bookings.models import Waitlist
from apps.facilities.models import FacilitySlot
from apps.core.exceptions import BusinessLogicException

@transaction.atomic
def join_waitlist(student, facility, slot_id):
    try:
        slot = FacilitySlot.objects.get(id=slot_id)
    except FacilitySlot.DoesNotExist:
        raise BusinessLogicException('Slot not found.', 'SLOT_NOT_FOUND', 404)

    if Waitlist.objects.filter(student=student, slot=slot, status__in=['WAITING', 'PROMOTED']).exists():
        raise BusinessLogicException('You are already on the waitlist or promoted for this slot.', 'ALREADY_ON_WAITLIST', 400)

    agg = Waitlist.objects.filter(slot=slot, status='WAITING').aggregate(Max('position'))
    next_pos = (agg['position__max'] or 0) + 1

    # Set expiry exactly at slot start time
    expires = timezone.make_aware(timezone.datetime.combine(slot.slot_date, slot.start_time))

    waitlist = Waitlist.objects.create(
        student=student,
        facility=facility,
        slot=slot,
        position=next_pos,
        status='WAITING',
        expires_at=expires
    )
    return waitlist

@transaction.atomic
def leave_waitlist(student, waitlist_id):
    try:
        waitlist = Waitlist.objects.select_for_update().get(id=waitlist_id, student=student, status='WAITING')
    except Waitlist.DoesNotExist:
        raise BusinessLogicException('Active waitlist entry not found.', 'NOT_FOUND', 404)

    waitlist.status = 'REMOVED'
    waitlist.save(update_fields=['status'])

    # Reorder remaining waitlist
    remaining = Waitlist.objects.filter(slot=waitlist.slot, status='WAITING', position__gt=waitlist.position).order_by('position')
    for entry in remaining:
        entry.position -= 1
        entry.save(update_fields=['position'])

    return waitlist
