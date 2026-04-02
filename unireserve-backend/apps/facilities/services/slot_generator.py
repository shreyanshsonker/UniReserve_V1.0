from datetime import timedelta, datetime, date
from django.utils import timezone
from apps.facilities.models import Facility, FacilitySlot

def generate_slots_for_facility(facility: Facility, start_date: date, end_date: date):
    """
    Generates contiguous blocks of slots between start_date and end_date.
    Assumes standard operating hours for now (e.g. 08:00 to 22:00) or pulls from BookingRule if available.
    """
    # Just simple generation: 8 AM to 10 PM.
    # In real app, might read facility-specific rules.
    start_hour = 8
    end_hour = 22
    slot_duration = timedelta(minutes=facility.slot_duration_mins)
    
    current_date = start_date
    created_slots = 0
    
    while current_date <= end_date:
        # Start at 8 AM
        current_dt = datetime.combine(current_date, datetime.min.time()).replace(hour=start_hour)
        end_dt = datetime.combine(current_date, datetime.min.time()).replace(hour=end_hour)
        
        while current_dt + slot_duration <= end_dt:
            slot_end_dt = current_dt + slot_duration
            
            # Create or ignore if exists
            obj, created = FacilitySlot.objects.get_or_create(
                facility=facility,
                slot_date=current_date,
                start_time=current_dt.time(),
                defaults={
                    'end_time': slot_end_dt.time(),
                    'available_capacity': facility.total_capacity,
                    'booked_count': 0,
                    'is_blocked': False
                }
            )
            if created:
                created_slots += 1
                
            current_dt += slot_duration
            
        current_date += timedelta(days=1)
        
    return created_slots
