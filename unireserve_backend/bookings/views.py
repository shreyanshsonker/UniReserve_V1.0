from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from .models import Booking, BookingRule, Waitlist
from .serializers import BookingSerializer, BookingCreateSerializer, BookingRuleSerializer, WaitlistSerializer
from .recommendations import RecommendationService
from facilities.serializers import FacilitySlotSerializer
from .services import BookingService
from facilities.models import FacilitySlot
from accounts.permissions import IsManager, IsAdminOrManager

class BookingCreateView(APIView):
    """
    POST: Create a new booking for the authenticated user.
    Uses BookingService to handle atomic logic and validations.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        if serializer.is_valid():
            slot = get_object_or_404(FacilitySlot, pk=serializer.validated_data['slot_id'])
            
            try:
                booking = BookingService.execute_booking(request.user, slot)
                return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except IntegrityError:
                return Response(
                    {'error': 'A booking record for this session already exists. Please refresh and try again.'},
                    status=status.HTTP_409_CONFLICT,
                )
            except Exception as e:
                return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MyBookingsView(generics.ListAPIView):
    """
    GET: List all bookings for the current user.
    Can be filtered by ?active=true/false
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BookingSerializer

    def get_queryset(self):
        queryset = Booking.objects.filter(user=self.request.user)
        active_only = self.request.query_params.get('active')
        
        if active_only == 'true':
            queryset = queryset.filter(status__in=['active', 'pending_approval'])
            
        return queryset

class BookingCancelView(APIView):
    """
    PATCH: Cancel a booking.
    Enforces 30-min threshold check via BookingService.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, user=request.user)
        
        try:
            cancelled_booking = BookingService.cancel_booking(booking)
            return Response(BookingSerializer(cancelled_booking).data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ManagerPendingApprovalsView(generics.ListAPIView):
    """
    GET: List all pending_approval bookings for facilities managed by current user.
    """
    permission_classes = [IsManager]
    serializer_class = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(
            slot__facility__manager=self.request.user,
            status='pending_approval'
        )

class BookingApprovalActionView(APIView):
    """
    PATCH: Approve or reject a booking (manager action).
    """
    permission_classes = [IsManager]

    def patch(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, slot__facility__manager=request.user)
        action = request.data.get('action') # 'approve' or 'reject'
        note = request.data.get('note', '') or ''

        try:
            if action == 'approve':
                approved_booking = BookingService.approve_booking(booking, note)
                return Response(BookingSerializer(approved_booking).data, status=status.HTTP_200_OK)
            
            elif action == 'reject':
                rejected_booking = BookingService.reject_booking(booking, note)
                return Response(BookingSerializer(rejected_booking).data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

class WaitlistJoinView(APIView):
    """
    POST: Join a waitlist for a full slot.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        slot_id = request.data.get('slot_id')
        slot = get_object_or_404(FacilitySlot, pk=slot_id)
        
        try:
            waitlist = BookingService.join_waitlist(request.user, slot)
            return Response(WaitlistSerializer(waitlist).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MyWaitlistView(generics.ListAPIView):
    """
    GET: List all waitlist entries for the current user.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WaitlistSerializer

    def get_queryset(self):
        return Waitlist.objects.filter(user=self.request.user)

class WaitlistLeaveView(APIView):
    """
    DELETE: Leave a waitlist.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        waitlist = get_object_or_404(Waitlist, pk=pk, user=request.user)
        waitlist.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class RecommendationListView(APIView):
    """
    GET: Dynamic list of up to 3 recommended slots for the user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        recommendations = RecommendationService.get_recommendations(request.user)
        
        data = []
        for rec in recommendations:
            data.append({
                'slot': FacilitySlotSerializer(rec['slot']).data,
                'reason': rec['reason'],
                'facility_name': rec['slot'].facility.name
            })
            
        return Response(data, status=status.HTTP_200_OK)

class BookingCheckInView(APIView):
    """
    POST: Student check-in for an active booking.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, user=request.user)
        try:
            BookingService.check_in(booking)
            return Response({'message': 'Check-in successful! Enjoy your session.'}, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProcessNoShowsView(APIView):
    """
    POST: (Admin/System) Process all slots that have ended to flag no-shows.
    In a real app, this would be a Cron job / Management command.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        now = timezone.now()
        # Find active bookings for slots that started more than 15 mins ago and have ended
        # We process slots that finished within the last 24 hours to be safe
        past_slots = FacilitySlot.objects.filter(
            date__lte=now.date(),
            start_time__lte=(now - timedelta(minutes=15)).time()
        )
        
        expired_bookings = Booking.objects.filter(
            slot__in=past_slots,
            status='active',
            checked_in_at__isnull=True
        )
        
        count = 0
        for booking in expired_bookings:
            # Check if really ended (time comparison)
            slot_start = timezone.datetime.combine(booking.slot.date, booking.slot.start_time)
            if timezone.is_naive(slot_start):
                slot_start = timezone.make_aware(slot_start)
                
            if now > (slot_start + timedelta(minutes=15)):
                BookingService.record_no_show(booking)
                count += 1
                
        return Response({'message': f'Processed no-shows. {count} bookings flagged.'}, status=status.HTTP_200_OK)
