from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'role',
            'student_id', 'employee_id', 'department', 'year_of_study',
            'profile_picture', 'is_banned', 'ban_until'
        )
        read_only_fields = ('id', 'email', 'role', 'is_banned', 'ban_until', 'student_id', 'employee_id')

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
