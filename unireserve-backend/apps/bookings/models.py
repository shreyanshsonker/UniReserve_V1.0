import uuid
import random
import string
from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel, UUIDModel
from apps.facilities.models import Facility, FacilitySlot

def generate_booking_reference():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))

class Booking(TimeStampedModel):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
        ('NO_SHOW', 'No Show'),
    )
    APPROVAL_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='bookings')
    facility = models.ForeignKey(Facility, on_delete=models.RESTRICT, related_name='bookings')
    slot = models.ForeignKey(FacilitySlot, on_delete=models.RESTRICT, related_name='bookings')
    booking_reference = models.CharField(max_length=12, default=generate_booking_reference, unique=True, editable=False)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    seat_number = models.PositiveSmallIntegerField(null=True, blank=True)
    group_size = models.PositiveSmallIntegerField(default=1)
    group_members = models.JSONField(null=True, blank=True)
    purpose = models.CharField(max_length=300, null=True, blank=True)
    
    approval_status = models.CharField(max_length=20, choices=APPROVAL_CHOICES, null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_bookings')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=500, null=True, blank=True)
    
    checked_in_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.CharField(max_length=500, null=True, blank=True)

class Waitlist(UUIDModel):
    STATUS_CHOICES = (
        ('WAITING', 'Waiting'),
        ('PROMOTED', 'Promoted'),
        ('EXPIRED', 'Expired'),
        ('REMOVED', 'Removed'),
    )

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='waitlists')
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE)
    slot = models.ForeignKey(FacilitySlot, on_delete=models.CASCADE, related_name='waitlist_entries')
    position = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='WAITING')
    
    joined_at = models.DateTimeField(auto_now_add=True)
    promoted_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()

    class Meta:
        unique_together = ('student', 'slot')
