from rest_framework import serializers
from apps.accounts.models import User
from apps.bookings.models import Booking
from apps.facilities.models import FacilitySlot


class BookingStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role')


class BookingSlotSerializer(serializers.ModelSerializer):
    facility_id = serializers.UUIDField(read_only=True)
    facility_name = serializers.CharField(source='facility.name', read_only=True)

    class Meta:
        model = FacilitySlot
        fields = (
            'id',
            'facility_id',
            'facility_name',
            'slot_date',
            'start_time',
            'end_time',
            'available_capacity',
            'booked_count',
            'is_blocked',
        )

class BookingSerializer(serializers.ModelSerializer):
    student = BookingStudentSerializer(read_only=True)
    slot = BookingSlotSerializer(read_only=True)
    facility_name = serializers.CharField(source='facility.name', read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id',
            'student',
            'facility',
            'facility_name',
            'slot',
            'booking_reference',
            'status',
            'seat_number',
            'group_size',
            'group_members',
            'purpose',
            'approval_status',
            'approved_by',
            'approved_at',
            'rejection_reason',
            'checked_in_at',
            'cancelled_at',
            'cancellation_reason',
            'created_at',
            'updated_at',
            'is_deleted',
        )
        read_only_fields = (
            'id', 'student', 'facility', 'slot', 'facility_name', 'booking_reference',
            'status', 'approval_status', 'approved_by', 'approved_at', 
            'rejection_reason', 'checked_in_at', 'cancelled_at', 
            'cancellation_reason', 'created_at', 'updated_at', 'is_deleted'
        )

class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ('facility', 'slot', 'group_size', 'group_members', 'purpose')
