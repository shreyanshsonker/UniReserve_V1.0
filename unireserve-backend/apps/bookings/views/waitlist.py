from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.bookings.models import Waitlist
from apps.bookings.serializers.waitlist import WaitlistSerializer, WaitlistJoinSerializer
from apps.bookings.services.waitlist_service import join_waitlist, leave_waitlist
from apps.core.permissions import IsStudent

class WaitlistViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return Waitlist.objects.filter(student=user).order_by('-joined_at')
        return Waitlist.objects.all().order_by('-joined_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return WaitlistJoinSerializer
        return WaitlistSerializer

    def get_permissions(self):
        if self.action in ['create', 'leave']:
            return [permissions.IsAuthenticated(), IsStudent()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        facility = serializer.validated_data['facility']
        slot = serializer.validated_data['slot']
        
        waitlist = join_waitlist(request.user, facility, slot.id)
        return Response(WaitlistSerializer(waitlist).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        waitlist = leave_waitlist(request.user, pk)
        return Response(WaitlistSerializer(waitlist).data)
