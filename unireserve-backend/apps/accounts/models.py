from django.db import models
from django.contrib.auth.models import AbstractUser
from apps.core.models import TimeStampedModel, UUIDModel
from .managers import UserManager
import uuid

class User(AbstractUser):
    ROLE_CHOICES = (
        ('STUDENT', 'Student'),
        ('MANAGER', 'Manager'),
        ('ADMIN', 'Admin'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField(unique=True)
    
    role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    student_id = models.CharField(max_length=50, null=True, blank=True, unique=True)
    employee_id = models.CharField(max_length=50, null=True, blank=True, unique=True)
    department = models.CharField(max_length=150, null=True, blank=True)
    year_of_study = models.PositiveSmallIntegerField(null=True, blank=True)
    
    is_active = models.BooleanField(default=False)
    is_banned = models.BooleanField(default=False)
    ban_until = models.DateTimeField(null=True, blank=True)
    no_show_count = models.PositiveSmallIntegerField(default=0)
    warning_count = models.PositiveSmallIntegerField(default=0)
    profile_picture = models.URLField(max_length=500, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    objects = UserManager()

    def soft_delete(self):
        self.is_deleted = True
        self.save()

class EmailVerification(TimeStampedModel):
    TOKEN_TYPE_CHOICES = (
        ('EMAIL_VERIFY', 'Email Verification'),
        ('PASSWORD_RESET', 'Password Reset'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True)
    token_type = models.CharField(max_length=20, choices=TOKEN_TYPE_CHOICES)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

class ManagerApprovalRequest(TimeStampedModel):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='manager_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_managers')
    rejection_reason = models.CharField(max_length=500, null=True, blank=True)
