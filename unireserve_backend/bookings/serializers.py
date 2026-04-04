from rest_framework import serializers
from .models import Booking, BookingRule, Waitlist
from facilities.serializers import FacilitySlotSerializer, FacilitySerializer

class BookingRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingRule
        fields = ['id', 'name', 'rule_key', 'value', 'description']

class BookingSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.name')
    slot_details = FacilitySlotSerializer(source='slot', read_only=True)
    facility_name = serializers.ReadOnlyField(source='slot.facility.name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'user_name', 'slot', 'slot_details', 
            'facility_name', 'status', 'status_display', 
            'created_at', 'updated_at', 'checked_in_at', 'manager_note'
        ]
        read_only_fields = ['user', 'status', 'checked_in_at', 'manager_note']

class BookingCreateSerializer(serializers.Serializer):
    slot_id = serializers.IntegerField()

    def validate_slot_id(self, value):
        from facilities.models import FacilitySlot
        if not FacilitySlot.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid slot ID.")
        return value

class WaitlistSerializer(serializers.ModelSerializer):
    slot_details = FacilitySlotSerializer(source='slot', read_only=True)
    facility_name = serializers.ReadOnlyField(source='slot.facility.name')
    position = serializers.SerializerMethodField()

    class Meta:
        model = Waitlist
        fields = ['id', 'user', 'slot', 'slot_details', 'facility_name', 'position', 'created_at']
        read_only_fields = ['user', 'position']

    def get_position(self, obj):
        # Calculate how many people joined BEFORE this person for the same slot
        return Waitlist.objects.filter(
            slot=obj.slot, 
            created_at__lt=obj.created_at
        ).count() + 1
