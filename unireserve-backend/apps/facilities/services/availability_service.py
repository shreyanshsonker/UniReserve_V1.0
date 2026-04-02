from apps.facilities.models import FacilitySlot
from collections import defaultdict

def get_facility_availability(facility_id, target_date):
    """
    Returns slot availability grouped by time/status.
    """
    slots = FacilitySlot.objects.filter(
        facility_id=facility_id,
        slot_date=target_date
    ).order_by('start_time')
    
    # We rely on the serializer to format the color and capacity.
    return slots
