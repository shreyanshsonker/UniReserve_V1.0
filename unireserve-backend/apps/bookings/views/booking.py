from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.bookings.models import Booking
from apps.bookings.serializers.booking import BookingSerializer, BookingCreateSerializer
from apps.bookings.services.booking_service import create_booking, cancel_booking, process_booking_approval
from apps.core.permissions import IsManager, IsAdmin, IsStudent
from apps.facilities.models import Facility

class BookingViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return Booking.objects.filter(student=user).order_by('-created_at')
        elif user.role == 'MANAGER':
            return Booking.objects.filter(facility__manager=user).order_by('-created_at')
        return Booking.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        return BookingSerializer

    def get_permissions(self):
        if self.action in ['create', 'cancel']:
            return [permissions.IsAuthenticated(), IsStudent()]
        elif self.action in ['approve', 'reject']:
            return [permissions.IsAuthenticated(), IsManager() | IsAdmin()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        facility = serializer.validated_data['facility']
        slot = serializer.validated_data['slot']
        
        booking = create_booking(request.user, facility, slot.id, serializer.validated_data)
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reason = request.data.get('cancellation_reason')
        booking = cancel_booking(request.user, pk, reason)
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        booking = process_booking_approval(request.user, pk, approve=True)
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        reason = request.data.get('rejection_reason', 'Declined by manager')
        booking = process_booking_approval(request.user, pk, approve=False, rejection_reason=reason)
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=['post'], url_path='check-in')
    def check_in(self, request, pk=None):
        from apps.bookings.services.booking_service import check_in_booking
        booking = check_in_booking(request.user, pk)
        return Response(BookingSerializer(booking).data)
