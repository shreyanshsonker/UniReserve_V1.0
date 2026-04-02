from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.facilities.models import FacilitySlot, Facility
from apps.facilities.serializers.slot import FacilitySlotSerializer
from apps.core.permissions import IsManager, IsAdmin
from apps.core.exceptions import BusinessLogicException
from django.shortcuts import get_object_or_404
from apps.facilities.services.slot_generator import generate_slots_for_facility
from datetime import datetime

class FacilitySlotViewSet(viewsets.ModelViewSet):
    queryset = FacilitySlot.objects.all()
    serializer_class = FacilitySlotSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'generate', 'block']:
            return [permissions.IsAuthenticated(), IsAdmin() | IsManager()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        facility_id = request.data.get('facility_id')
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')
        
        if not facility_id or not start_date_str or not end_date_str:
            raise BusinessLogicException('facility_id, start_date, and end_date are required', 'MISSING_PARAMS', 400)
            
        facility = get_object_or_404(Facility, id=facility_id)
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        count = generate_slots_for_facility(facility, start_date, end_date)
        return Response({'detail': f'Successfully generated {count} new slots.'})

    @action(detail=True, methods=['patch'], url_path='block')
    def block(self, request, pk=None):
        slot = self.get_object()
        is_blocked = request.data.get('is_blocked', True)
        reason = request.data.get('block_reason', '')
        
        slot.is_blocked = is_blocked
        slot.block_reason = reason if is_blocked else None
        slot.save(update_fields=['is_blocked', 'block_reason'])
        
        action_word = 'blocked' if is_blocked else 'unblocked'
        return Response({'detail': f'Slot {action_word} successfully.'})
