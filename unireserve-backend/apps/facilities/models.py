from django.db import models
from apps.core.models import TimeStampedModel, UUIDModel
from django.conf import settings

class Facility(TimeStampedModel):
    FACILITY_TYPES = (
        ('LIBRARY_SEAT', 'Library Seat'),
        ('STUDENT_ROOM', 'Student Room'),
        ('STUDY_ROOM', 'Study Room'),
        ('COMPUTER_LAB', 'Computer Lab'),
        ('DISCUSSION_ROOM', 'Discussion Room'),
        ('SEMINAR_HALL', 'Seminar Hall'),
        ('MUSIC_ROOM', 'Music Room'),
        ('PRINTING_LAB', 'Printing Lab'),
    )

    name = models.CharField(max_length=200)
    facility_type = models.CharField(max_length=50, choices=FACILITY_TYPES)
    description = models.TextField(null=True, blank=True)
    building = models.CharField(max_length=150)
    floor = models.CharField(max_length=20, null=True, blank=True)
    room_number = models.CharField(max_length=30, null=True, blank=True)
    
    total_capacity = models.PositiveSmallIntegerField()
    requires_approval = models.BooleanField(default=False)
    min_group_size = models.PositiveSmallIntegerField(default=1)
    max_booking_duration_mins = models.PositiveSmallIntegerField(default=120)
    slot_duration_mins = models.PositiveSmallIntegerField(default=60)
    
    images = models.JSONField(null=True, blank=True)
    amenities = models.JSONField(null=True, blank=True)
    
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    is_active = models.BooleanField(default=True)

class FacilitySlot(UUIDModel):
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='slots')
    slot_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    available_capacity = models.PositiveSmallIntegerField()
    booked_count = models.PositiveSmallIntegerField(default=0)
    is_blocked = models.BooleanField(default=False)
    block_reason = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('facility', 'slot_date', 'start_time')

class BookingRule(models.Model):
    facility = models.ForeignKey(Facility, null=True, blank=True, on_delete=models.CASCADE, related_name='rules')
    rule_key = models.CharField(max_length=100)
    rule_value = models.CharField(max_length=100)
    description = models.CharField(max_length=300, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('facility', 'rule_key')
