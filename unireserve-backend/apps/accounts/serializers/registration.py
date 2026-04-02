from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from apps.accounts.models import EmailVerification

User = get_user_model()

class StudentRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name', 'student_id', 'department', 'year_of_study')

    def create(self, validated_data):
        validated_data['role'] = 'STUDENT'
        validated_data['is_active'] = False
        user = User.objects.create_user(**validated_data)
        return user

class ManagerRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    facility_name = serializers.CharField(write_only=True, required=False) # For manager request context
    
    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name', 'employee_id', 'department', 'facility_name')

    def create(self, validated_data):
        validated_data.pop('facility_name', None)
        validated_data['role'] = 'MANAGER'
        validated_data['is_active'] = False
        user = User.objects.create_user(**validated_data)
        return user
