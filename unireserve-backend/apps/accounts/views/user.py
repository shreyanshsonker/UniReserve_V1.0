from rest_framework import viewsets, mixins
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from apps.accounts.models import User
from apps.accounts.serializers.profile import UserProfileSerializer, AdminUserSerializer
from apps.core.permissions import IsAdmin
from apps.accounts.services.user_service import process_manager_approval

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = AdminUserSerializer

    @action(detail=True, methods=['patch'], url_path='approve-manager')
    def approve_manager(self, request, pk=None):
        # We expect a request body with request_id, approve boolean, reason
        request_id = request.data.get('request_id')
        approve = request.data.get('approve', True)
        reason = request.data.get('reason')
        process_manager_approval(request_id, request.user, approve, reason)
        return Response({'detail': 'Manager request processed.'})

    @action(detail=True, methods=['patch'], url_path='ban')
    def ban_user(self, request, pk=None):
        user = self.get_object()
        is_banned = request.data.get('is_banned', True)
        ban_until = request.data.get('ban_until')
        
        user.is_banned = is_banned
        user.ban_until = ban_until if is_banned else None
        user.save()
        return Response({'detail': f'User ban status updated to {is_banned}.'})
