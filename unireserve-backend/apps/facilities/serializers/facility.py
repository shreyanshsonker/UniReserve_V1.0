from rest_framework import serializers
from apps.facilities.models import Facility

class FacilityListSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)

    class Meta:
        model = Facility
        fields = ('id', 'name', 'facility_type', 'building', 'total_capacity', 'is_active', 'manager_name')

class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'is_deleted')
