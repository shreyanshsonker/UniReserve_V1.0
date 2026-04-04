from django.db import models
from django.conf import settings
from facilities.models import FacilitySlot

class Booking(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending_approval', 'Pending Approval'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No-Show'),
        ('attended', 'Attended'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='bookings'
    )
    slot = models.ForeignKey(
        FacilitySlot, 
        on_delete=models.CASCADE, 
        related_name='bookings'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    manager_note = models.TextField(blank=True, help_text="Reason for rejection or special instructions")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.name} - {self.slot.facility.name} ({self.status})"

class BookingRule(models.Model):
    """
    Global rules for the system, editable by Super Admin.
    Example rule_key: 'max_active_bookings_per_day'
    """
    name = models.CharField(max_length=100)
    rule_key = models.SlugField(max_length=50, unique=True)
    value = models.IntegerField()
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name}: {self.value}"

class Waitlist(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='waitlists'
    )
    slot = models.ForeignKey(
        FacilitySlot, 
        on_delete=models.CASCADE, 
        related_name='waitlist_entries'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        unique_together = ['user', 'slot']

    def __str__(self):
        return f"Waitlist: {self.user.name} for {self.slot}"
