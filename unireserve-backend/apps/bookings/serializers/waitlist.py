from rest_framework import serializers
from apps.bookings.models import Waitlist

class WaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Waitlist
        fields = '__all__'
        read_only_fields = ('id', 'student', 'position', 'status', 'joined_at', 'promoted_at', 'expires_at')

class WaitlistJoinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Waitlist
        fields = ('facility', 'slot')
