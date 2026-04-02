from rest_framework import serializers
from apps.notifications.models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'user', 'notification_type', 'title', 'body', 'related_booking', 'sent_via_email', 'email_sent_at', 'created_at')
