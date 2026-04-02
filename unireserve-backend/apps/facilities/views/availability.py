from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.facilities.services.availability_service import get_facility_availability
from apps.facilities.serializers.slot import SlotAvailabilitySerializer
from apps.core.exceptions import BusinessLogicException
from datetime import datetime

class AvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, facility_id):
        target_date_str = request.query_params.get('date')
        if not target_date_str:
            raise BusinessLogicException('date query param is required', 'MISSING_PARAM', 400)
            
        target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        slots = get_facility_availability(facility_id, target_date)
        
        serializer = SlotAvailabilitySerializer(slots, many=True)
        return Response(serializer.data)
