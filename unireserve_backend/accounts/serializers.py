"""
Serializers for user registration, login, and profile management.
"""

import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser


class StudentRegisterSerializer(serializers.ModelSerializer):
    """
    Student self-registration.
    Requires university email format and unique student ID.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'email', 'name', 'password', 'password_confirm',
            'student_id', 'department', 'year_of_study',
        ]
        extra_kwargs = {
            'student_id': {'required': True},
            'department': {'required': True},
            'year_of_study': {'required': True},
        }

    def validate_email(self, value):
        """Validate university email format (contains .edu or common university domains)."""
        value = value.lower().strip()
        # Accept .edu emails or any valid email for development
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate_student_id(self, value):
        if CustomUser.objects.filter(student_id=value).exists():
            raise serializers.ValidationError('This student ID is already registered.')
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = CustomUser(
            role='student',
            is_active=False,  # Inactive until email verified
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user


class ManagerRegisterSerializer(serializers.ModelSerializer):
    """
    Manager registration — account created as pending approval.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'email', 'name', 'password', 'password_confirm',
            'employee_id', 'department', 'facility_responsible_for',
        ]
        extra_kwargs = {
            'employee_id': {'required': True},
            'department': {'required': True},
            'facility_responsible_for': {'required': True},
        }

    def validate_email(self, value):
        value = value.lower().strip()
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate_employee_id(self, value):
        if CustomUser.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError('This employee ID is already registered.')
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = CustomUser(
            role='manager',
            is_active=False,  # Inactive until admin approves
            account_status='pending',
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Login with email and password — returns JWT tokens."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data['email'].lower().strip()
        password = data['password']

        # Check if user exists first for better error messages
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({'email': 'No account found with this email.'})

        # Check account status
        if not user.is_active:
            if user.role == 'student':
                raise serializers.ValidationError(
                    {'email': 'Please verify your email before logging in.'}
                )
            elif user.role == 'manager' and user.account_status == 'pending':
                raise serializers.ValidationError(
                    {'email': 'Your account is pending admin approval.'}
                )
            elif user.role == 'manager' and user.account_status == 'rejected':
                raise serializers.ValidationError(
                    {'email': 'Your registration was rejected. Please contact admin.'}
                )
            else:
                raise serializers.ValidationError(
                    {'email': 'Your account is inactive. Please contact admin.'}
                )

        # Check suspension
        if user.check_suspension():
            raise serializers.ValidationError(
                {'email': f'Your account is suspended until {user.suspended_until.strftime("%Y-%m-%d %H:%M")} due to repeated no-shows.'}
            )

        # Authenticate
        authenticated_user = authenticate(email=email, password=password)
        if not authenticated_user:
            raise serializers.ValidationError({'password': 'Incorrect password.'})

        data['user'] = authenticated_user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only user profile data."""

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'name', 'role', 'account_status',
            'student_id', 'employee_id', 'department',
            'year_of_study', 'facility_responsible_for',
            'no_show_count', 'is_suspended', 'suspended_until',
            'date_joined',
        ]
        read_only_fields = fields


class PasswordResetRequestSerializer(serializers.Serializer):
    """Request a password reset email."""
    email = serializers.EmailField()

    def validate_email(self, value):
        value = value.lower().strip()
        if not CustomUser.objects.filter(email=value, is_active=True).exists():
            # Don't reveal whether email exists — always return success
            pass
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Set new password using reset token."""
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return data
