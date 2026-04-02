from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.feedback import FeedbackViewSet
from .views.analytics import AnalyticsSnapshotViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'feedback', FeedbackViewSet, basename='feedback')
router.register(r'snapshots', AnalyticsSnapshotViewSet, basename='analytics-snapshots')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')

urlpatterns = [
    path('', include(router.urls)),
]
