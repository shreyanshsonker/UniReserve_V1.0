from django.db import models
from django.conf import settings
from apps.core.models import UUIDModel
from apps.facilities.models import Facility
from apps.bookings.models import Booking

class Feedback(UUIDModel):
    booking = models.OneToOneField(Booking, on_delete=models.RESTRICT, related_name='feedback')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='feedbacks')
    facility = models.ForeignKey(Facility, on_delete=models.RESTRICT, related_name='feedbacks')
    
    cleanliness_rating = models.PositiveSmallIntegerField()
    equipment_rating = models.PositiveSmallIntegerField()
    experience_rating = models.PositiveSmallIntegerField()
    
    overall_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    
    comment = models.TextField(null=True, blank=True)
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.cleanliness_rating and self.equipment_rating and self.experience_rating:
            self.overall_rating = round((self.cleanliness_rating + self.equipment_rating + self.experience_rating) / 3.0, 2)
        super().save(*args, **kwargs)

class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    actor_role = models.CharField(max_length=50)
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=50, null=True, blank=True)
    target_id = models.CharField(max_length=36, null=True, blank=True)
    payload = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class AnalyticsDailySnapshot(models.Model):
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='analytics_snapshots')
    snapshot_date = models.DateField()
    
    total_bookings = models.PositiveSmallIntegerField(default=0)
    confirmed_bookings = models.PositiveSmallIntegerField(default=0)
    cancelled_bookings = models.PositiveSmallIntegerField(default=0)
    no_show_count = models.PositiveSmallIntegerField(default=0)
    
    utilization_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    peak_hour_start = models.TimeField(null=True, blank=True)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    unique_students = models.PositiveSmallIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('facility', 'snapshot_date')
