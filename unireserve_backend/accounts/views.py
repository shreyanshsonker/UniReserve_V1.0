"""
Authentication views for UniReserve.
Handles registration, email verification, login, password reset, and user management.
"""

from django.conf import settings
from django.core import signing
from django.contrib.auth import update_session_auth_hash
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser
from .serializers import (
    StudentRegisterSerializer,
    ManagerRegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from .permissions import IsAdminUser
from notifications.email import (
    send_verification_email,
    send_manager_pending_email,
    send_manager_approved_email,
    send_manager_rejected_email,
    send_password_reset_email,
)


# ──────────────────────────────────────────────
# Registration
# ──────────────────────────────────────────────

class StudentRegisterView(APIView):
    """
    POST /api/auth/register/student/
    Creates inactive student account and sends verification email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate verification token
        token = signing.dumps(user.pk, salt='email-verification')
        verification_url = f'{settings.FRONTEND_URL}/verify-email?token={token}'
        send_verification_email(user, verification_url)

        return Response(
            {
                'message': 'Registration successful! Please check your email to verify your account.',
                'email': user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class ManagerRegisterView(APIView):
    """
    POST /api/auth/register/manager/
    Creates pending manager account. Admin must approve before login.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ManagerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        send_manager_pending_email(user)

        return Response(
            {
                'message': 'Registration submitted! An administrator will review your application.',
                'email': user.email,
            },
            status=status.HTTP_201_CREATED,
        )


# ──────────────────────────────────────────────
# Email Verification
# ──────────────────────────────────────────────

class EmailVerifyView(APIView):
    """
    GET /api/auth/verify/<token>/
    Activates student account on valid token.
    """
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            user_pk = signing.loads(
                token,
                salt='email-verification',
                max_age=settings.EMAIL_VERIFICATION_TOKEN_MAX_AGE,
            )
            user = CustomUser.objects.get(pk=user_pk)

            if user.is_active:
                return Response(
                    {'message': 'Email already verified. You can log in.'},
                    status=status.HTTP_200_OK,
                )

            user.is_active = True
            user.save(update_fields=['is_active'])

            return Response(
                {'message': 'Email verified successfully! You can now log in.'},
                status=status.HTTP_200_OK,
            )

        except signing.SignatureExpired:
            return Response(
                {'error': 'Verification link has expired. Please register again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except (signing.BadSignature, CustomUser.DoesNotExist):
            return Response(
                {'error': 'Invalid verification link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ──────────────────────────────────────────────
# Login
# ──────────────────────────────────────────────

class LoginView(APIView):
    """
    POST /api/auth/login/
    Returns JWT access + refresh tokens and user info.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserProfileSerializer(user).data,
        })


# ──────────────────────────────────────────────
# Token Refresh
# ──────────────────────────────────────────────

class TokenRefreshView(APIView):
    """
    POST /api/auth/token/refresh/
    Returns new access token using refresh token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        except Exception:
            return Response(
                {'error': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )


# ──────────────────────────────────────────────
# Password Reset
# ──────────────────────────────────────────────

class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/
    Sends password reset email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        try:
            user = CustomUser.objects.get(email=email, is_active=True)
            token = signing.dumps(user.pk, salt='password-reset')
            reset_url = f'{settings.FRONTEND_URL}/reset-password?token={token}'
            send_password_reset_email(user, reset_url)
        except CustomUser.DoesNotExist:
            pass  # Don't reveal whether email exists

        return Response(
            {'message': 'If an account with that email exists, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset/confirm/
    Sets new password using valid reset token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            user_pk = signing.loads(
                token,
                salt='password-reset',
                max_age=settings.PASSWORD_RESET_TOKEN_MAX_AGE,
            )
            user = CustomUser.objects.get(pk=user_pk)
            user.set_password(new_password)
            user.save()

            return Response(
                {'message': 'Password reset successful. You can now log in with your new password.'},
                status=status.HTTP_200_OK,
            )

        except signing.SignatureExpired:
            return Response(
                {'error': 'Reset link has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except (signing.BadSignature, CustomUser.DoesNotExist):
            return Response(
                {'error': 'Invalid reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ──────────────────────────────────────────────
# User Profile
# ──────────────────────────────────────────────

class UserProfileView(APIView):
    """
    GET /api/auth/profile/
    Returns authenticated user's profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)


# ──────────────────────────────────────────────
# Admin: Manager Approval
# ──────────────────────────────────────────────

class PendingManagersListView(generics.ListAPIView):
    """
    GET /api/auth/admin/pending-managers/
    Lists all managers awaiting approval.
    """
    permission_classes = [IsAdminUser]
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        return CustomUser.objects.filter(role='manager', account_status='pending')


class ApproveManagerView(APIView):
    """
    PATCH /api/auth/admin/approve-manager/<id>/
    Admin approves a pending manager account.
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk, role='manager', account_status='pending')
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Manager not found or not pending.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.is_active = True
        user.account_status = 'active'
        user.save(update_fields=['is_active', 'account_status'])

        send_manager_approved_email(user)

        return Response(
            {'message': f'{user.name} has been approved as Facility Manager.'},
            status=status.HTTP_200_OK,
        )


class RejectManagerView(APIView):
    """
    PATCH /api/auth/admin/reject-manager/<id>/
    Admin rejects a pending manager registration.
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk, role='manager', account_status='pending')
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Manager not found or not pending.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        reason = request.data.get('reason', '')
        user.account_status = 'rejected'
        user.save(update_fields=['account_status'])

        send_manager_rejected_email(user, reason)

        return Response(
            {'message': f'{user.name} has been rejected.'},
            status=status.HTTP_200_OK,
        )


# ──────────────────────────────────────────────
# Admin: User Management
# ──────────────────────────────────────────────

class UserListView(generics.ListAPIView):
    """
    GET /api/auth/admin/users/
    Admin lists all users with optional role filter.
    """
    permission_classes = [IsAdminUser]
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        queryset = CustomUser.objects.all()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class ToggleUserActiveView(APIView):
    """
    PATCH /api/auth/admin/users/<id>/toggle-active/
    Admin activates or deactivates a user.
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])

        action = 'activated' if user.is_active else 'deactivated'
        return Response({'message': f'{user.name} has been {action}.'})


class ClearWarningsView(APIView):
    """
    PATCH /api/auth/admin/users/<id>/clear-warnings/
    Admin clears a user's no-show warnings and unsuspends.
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.no_show_count = 0
        user.is_suspended = False
        user.suspended_until = None
        user.save(update_fields=['no_show_count', 'is_suspended', 'suspended_until'])

        return Response({'message': f'Warnings cleared for {user.name}.'})
