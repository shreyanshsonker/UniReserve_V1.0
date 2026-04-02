from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from apps.accounts.serializers.registration import StudentRegisterSerializer, ManagerRegisterSerializer
from apps.accounts.services.user_service import prepare_student_registration, prepare_manager_registration, verify_email_token

class StudentRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        prepare_student_registration(user)
        detail = 'Registration successful. You can now login.' if settings.DEBUG or getattr(settings, 'TESTING', False) else 'Registration successful. Check your email to verify.'
        return Response({'detail': detail}, status=status.HTTP_201_CREATED)

class ManagerRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ManagerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        facility_name = serializer.validated_data.get('facility_name')
        prepare_manager_registration(user, facility_name)
        detail = 'Registration successful. You can now login.' if settings.DEBUG or getattr(settings, 'TESTING', False) else 'Registration successful. Pending admin approval.'
        return Response({'detail': detail}, status=status.HTTP_201_CREATED)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        verify_email_token(token)
        return Response({'detail': 'Email verified successfully. You can now login.'})
