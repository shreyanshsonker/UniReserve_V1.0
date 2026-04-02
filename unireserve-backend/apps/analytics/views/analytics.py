from rest_framework import viewsets, mixins, permissions
from apps.analytics.models import AnalyticsDailySnapshot, AuditLog
from apps.analytics.serializers.analytics import AnalyticsSnapshotSerializer, AuditLogSerializer
from apps.core.permissions import IsAdmin, IsManager

class AnalyticsSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AnalyticsSnapshotSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'MANAGER':
            return AnalyticsDailySnapshot.objects.filter(facility__manager=user).order_by('-snapshot_date')
        return AnalyticsDailySnapshot.objects.all().order_by('-snapshot_date')

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsManager() | IsAdmin()]

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
