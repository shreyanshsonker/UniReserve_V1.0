from rest_framework import serializers
from .models import Facility, FacilitySlot

class FacilitySlotSerializer(serializers.ModelSerializer):
    availability_status = serializers.ReadOnlyField()
    slots_remaining = serializers.ReadOnlyField()

    class Meta:
        model = FacilitySlot
        fields = [
            'id', 'facility', 'date', 'start_time', 'end_time', 
            'capacity', 'current_bookings', 'is_blocked', 
            'availability_status', 'slots_remaining'
        ]
        read_only_fields = [
            'facility',
            'current_bookings',
            'is_blocked',
            'availability_status',
            'slots_remaining',
        ]

class FacilitySerializer(serializers.ModelSerializer):
    manager_name = serializers.ReadOnlyField(source='manager.name')
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Facility
        fields = [
            'id', 'name', 'type', 'type_display', 'description', 
            'location', 'manager', 'manager_name', 
            'capacity_per_slot', 'is_active', 'created_at'
        ]
        read_only_fields = ['manager', 'created_at']

class FacilityDetailSerializer(FacilitySerializer):
    # This will be used when we want to include basic slot info in the facility detail
    slots = FacilitySlotSerializer(many=True, read_only=True)

    class Meta(FacilitySerializer.Meta):
        fields = FacilitySerializer.Meta.fields + ['slots']
