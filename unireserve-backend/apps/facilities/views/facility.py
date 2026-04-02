from rest_framework import viewsets, permissions
from apps.facilities.models import Facility
from apps.facilities.serializers.facility import FacilitySerializer, FacilityListSerializer
from apps.core.permissions import IsManager, IsAdmin

class FacilityViewSet(viewsets.ModelViewSet):
    queryset = Facility.objects.filter(is_active=True)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FacilityListSerializer
        return FacilitySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdmin() | IsManager()]
        return [permissions.IsAuthenticated()]
    
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.is_deleted = True
        instance.save()
