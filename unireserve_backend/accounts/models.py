"""
Custom User model for UniReserve.
Uses email as the primary identifier instead of username.
Supports three roles: student, manager, admin.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    """Manager for CustomUser with email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model with email authentication and role-based access.

    Roles:
    - student: Can browse facilities, book slots, join waitlists
    - manager: Can manage assigned facilities, approve lab bookings
    - admin: Full system access, user management, analytics
    """

    ROLE_CHOICES = [
        ('student', 'Student'),
        ('manager', 'Facility Manager'),
        ('admin', 'Super Admin'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending Approval'),
        ('rejected', 'Rejected'),
    ]

    # ── Core fields ──
    email = models.EmailField(unique=True, max_length=255)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    account_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    # ── Student-specific ──
    student_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    department = models.CharField(max_length=100, blank=True, default='')
    year_of_study = models.PositiveIntegerField(blank=True, null=True)

    # ── Manager-specific ──
    employee_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    facility_responsible_for = models.CharField(max_length=255, blank=True, default='')

    # ── Status & enforcement ──
    is_active = models.BooleanField(default=False)  # False until email verified (students) or approved (managers)
    is_staff = models.BooleanField(default=False)
    no_show_count = models.PositiveIntegerField(default=0)
    is_suspended = models.BooleanField(default=False)
    suspended_until = models.DateTimeField(blank=True, null=True)

    # ── Timestamps ──
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.name} ({self.email}) - {self.get_role_display()}'

    @property
    def is_student(self):
        return self.role == 'student'

    @property
    def is_manager(self):
        return self.role == 'manager'

    @property
    def is_admin_user(self):
        return self.role == 'admin'

    def check_suspension(self):
        """Auto-unsuspend if suspension period has passed."""
        if self.is_suspended and self.suspended_until and timezone.now() >= self.suspended_until:
            self.is_suspended = False
            self.suspended_until = None
            self.no_show_count = 0
            self.save(update_fields=['is_suspended', 'suspended_until', 'no_show_count'])
        return self.is_suspended
