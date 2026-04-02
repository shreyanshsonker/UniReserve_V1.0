from rest_framework import serializers
from apps.facilities.models import BookingRule

class BookingRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingRule
        fields = '__all__'
        read_only_fields = ('id', 'updated_at', 'updated_by')
