from rest_framework import serializers
from apps.analytics.models import AnalyticsDailySnapshot, AuditLog

class AnalyticsSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsDailySnapshot
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'
