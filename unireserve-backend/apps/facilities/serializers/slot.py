from rest_framework import serializers
from apps.facilities.models import FacilitySlot

class FacilitySlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilitySlot
        fields = '__all__'

class SlotAvailabilitySerializer(serializers.ModelSerializer):
    status_color = serializers.SerializerMethodField()

    class Meta:
        model = FacilitySlot
        fields = ('id', 'slot_date', 'start_time', 'end_time', 'available_capacity', 'booked_count', 'is_blocked', 'status_color')

    def get_status_color(self, obj):
        # Determine the color based on PRD Section 6.3
        if obj.is_blocked:
            return 'DARK_GRAY'
        
        if obj.available_capacity <= 0:
            return 'GRAY'
            
        ratio = obj.booked_count / float(obj.available_capacity)
        
        if ratio >= 1.0:
            return 'GRAY'
        elif ratio >= 0.85:
            return 'RED'
        elif ratio >= 0.5:
            return 'YELLOW'
        else:
            return 'GREEN'
