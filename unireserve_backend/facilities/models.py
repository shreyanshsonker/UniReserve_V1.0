from django.db import models
from django.conf import settings

class Facility(models.Model):
    FACILITY_TYPES = [
        ('library', 'Library Seat'),
        ('study_room', 'Study Room'),
        ('computer_lab', 'Computer Lab'),
        ('discussion', 'Discussion Room'),
        ('seminar', 'Seminar Hall'),
        ('music', 'Music Practice Room'),
        ('3d_print', '3D Printing Lab'),
    ]

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=FACILITY_TYPES)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='managed_facilities'
    )
    capacity_per_slot = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Facilities"

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

class FacilitySlot(models.Model):
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    capacity = models.PositiveIntegerField()
    current_bookings = models.PositiveIntegerField(default=0)
    is_blocked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ['facility', 'date', 'start_time', 'end_time']

    def __str__(self):
        return f"{self.facility.name} | {self.date} | {self.start_time}-{self.end_time}"

    @property
    def availability_status(self):
        """
        Returns 'green', 'yellow', or 'red' based on occupancy.
        - Green: < 60%
        - Yellow: 60-89%
        - Red: >= 90%
        """
        if self.is_blocked:
            return 'blocked'
        
        if self.capacity == 0:
            return 'red'
            
        occupancy_rate = (self.current_bookings / self.capacity) * 100
        
        if occupancy_rate < 60:
            return 'green'
        elif occupancy_rate < 90:
            return 'yellow'
        else:
            return 'red'

    @property
    def slots_remaining(self):
        return max(0, self.capacity - self.current_bookings)
