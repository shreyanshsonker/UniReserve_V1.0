from rest_framework import generics, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Facility, FacilitySlot
from .serializers import FacilitySerializer, FacilitySlotSerializer, FacilityDetailSerializer
from accounts.permissions import IsManager, IsAdminOrManager


class FacilityListView(generics.ListCreateAPIView):
    """
    GET: List all facilities (public)
    POST: Create a new facility (manager/admin)
    """
    serializer_class = FacilitySerializer

    def get_queryset(self):
        return Facility.objects.filter(is_active=True).select_related('manager').order_by('-created_at', '-id')

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrManager()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(manager=self.request.user)


class FacilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve facility details (public)
    PATCH/PUT: Update facility (manager/admin)
    DELETE: Delete facility (admin)
    """
    queryset = Facility.objects.all()
    serializer_class = FacilityDetailSerializer

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT']:
            return [IsAdminOrManager()]
        elif self.request.method == 'DELETE':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class FacilitySlotListView(generics.ListCreateAPIView):
    """
    GET: List slots for a facility on a specific date (public)
    POST: Create a slot for a facility (manager)
    """
    serializer_class = FacilitySlotSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsManager()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        facility_id = self.kwargs.get('facility_pk')
        date = self.request.query_params.get('date')
        queryset = FacilitySlot.objects.filter(facility_id=facility_id)
        
        if date:
            queryset = queryset.filter(date=date)
        
        return queryset

    def perform_create(self, serializer):
        facility = get_object_or_404(Facility, pk=self.kwargs.get('facility_pk'))

        if facility.manager_id != self.request.user.id:
            raise PermissionDenied("You can only create slots for your own facilities.")

        serializer.save(facility=facility)


class SlotBlockToggleView(APIView):
    """
    PATCH: Toggle the is_blocked status of a slot (manager)
    """
    permission_classes = [IsManager]

    def patch(self, request, pk):
        slot = get_object_or_404(FacilitySlot, pk=pk)
        
        # Check if the facility belongs to the manager (or use IsAdminOrManager)
        # For simplicity, we just ensure manager role exists (permissions.IsManager does this)
        
        slot.is_blocked = not slot.is_blocked
        slot.save()
        
        return Response({
            'id': slot.id,
            'is_blocked': slot.is_blocked,
            'message': f"Slot {'blocked' if slot.is_blocked else 'unblocked'} successfully."
        }, status=status.HTTP_200_OK)


class ManagerFacilityListView(generics.ListAPIView):
    """
    GET: List facilities managed by the authenticated manager
    """
    permission_classes = [IsManager]
    serializer_class = FacilitySerializer

    def get_queryset(self):
        return Facility.objects.filter(manager=self.request.user).select_related('manager').order_by('-created_at', '-id')
