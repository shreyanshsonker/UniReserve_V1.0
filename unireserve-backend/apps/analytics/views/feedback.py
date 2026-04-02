from rest_framework import viewsets, permissions, mixins
from apps.analytics.models import Feedback
from apps.analytics.serializers.feedback import FeedbackSerializer, FeedbackCreateSerializer
from apps.core.permissions import IsStudent, IsManager, IsAdmin
from apps.core.exceptions import BusinessLogicException

class FeedbackViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return Feedback.objects.filter(student=user).order_by('-created_at')
        elif user.role == 'MANAGER':
            return Feedback.objects.filter(facility__manager=user).order_by('-created_at')
        return Feedback.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return FeedbackCreateSerializer
        return FeedbackSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsStudent()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        booking = serializer.validated_data['booking']
        if booking.student != self.request.user:
            raise BusinessLogicException('You can only leave feedback for your own bookings.', 'INVALID_BOOKING', 403)
        if booking.status != 'COMPLETED':
            raise BusinessLogicException('Feedback is only allowed for completed bookings.', 'BOOKING_NOT_COMPLETED', 400)
            
        serializer.save(student=self.request.user, facility=booking.facility)
