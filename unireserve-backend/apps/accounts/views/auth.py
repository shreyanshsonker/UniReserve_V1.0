from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
from django.contrib.auth import authenticate
from apps.accounts.serializers.auth import LoginSerializer
from apps.accounts.services.auth_service import get_tokens_for_user, blacklist_refresh_token
from apps.core.exceptions import BusinessLogicException

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
        )
        if not user:
            raise BusinessLogicException('Invalid credentials', 'INVALID_CREDENTIALS', 401)
            
        tokens = get_tokens_for_user(user)
        
        response = Response({'access': tokens['access']})
        # Set HTTPOnly cookie
        response.set_cookie(
            'refresh_token',
            tokens['refresh'],
            max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
            httponly=True,
            secure=settings.SESSION_COOKIE_SECURE if hasattr(settings, 'SESSION_COOKIE_SECURE') else False,
            samesite='Lax'
        )
        return response

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            blacklist_refresh_token(refresh_token)
            
        response = Response({'detail': 'Logged out successfully'})
        response.delete_cookie('refresh_token')
        return response

class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            raise BusinessLogicException('Refresh token missing', 'TOKEN_MISSING', 401)
            
        try:
            refresh = RefreshToken(refresh_token)
            access = str(refresh.access_token)
        except TokenError as e:
            raise BusinessLogicException('Refresh token invalid or expired', 'TOKEN_EXPIRED', 401)
            
        return Response({'access': access})

from apps.accounts.serializers.auth import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from apps.accounts.services.user_service import prepare_password_reset, confirm_password_reset

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prepare_password_reset(serializer.validated_data['email'])
        return Response({'detail': 'If the email exists, a reset link has been sent.'})

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        confirm_password_reset(serializer.validated_data['token'], serializer.validated_data['new_password'])
        return Response({'detail': 'Password has been reset successfully.'})
