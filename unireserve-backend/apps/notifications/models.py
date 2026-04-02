from django.db import models
from django.conf import settings
from apps.core.models import UUIDModel
from apps.bookings.models import Booking

class Notification(UUIDModel):
    TYPE_CHOICES = (
        ('BOOKING_CONFIRMED', 'Booking Confirmed'),
        ('BOOKING_CANCELLED', 'Booking Cancelled'),
        ('WAITLIST_PROMOTED', 'Waitlist Promoted'),
        ('REMINDER', 'Reminder'),
        ('BOOKING_APPROVED', 'Booking Approved'),
        ('BOOKING_REJECTED', 'Booking Rejected'),
        ('BAN_WARNING', 'Ban Warning'),
        ('NO_SHOW_RECORDED', 'No-Show Recorded'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    body = models.TextField()
    related_booking = models.ForeignKey(Booking, null=True, blank=True, on_delete=models.CASCADE)
    
    is_read = models.BooleanField(default=False)
    sent_via_email = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
