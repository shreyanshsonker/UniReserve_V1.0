"""
Custom permission classes for role-based access control.
"""

from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    """Allows access only to authenticated students."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'student'
        )


class IsManager(BasePermission):
    """Allows access only to authenticated facility managers."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'manager'
        )


class IsAdminUser(BasePermission):
    """Allows access only to authenticated super admins."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsAdminOrManager(BasePermission):
    """Allows access to both admins and managers."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('admin', 'manager')
        )


class IsNotSuspended(BasePermission):
    """Denies access to suspended users."""
    message = 'Your account is suspended due to repeated no-shows.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Auto-check and unsuspend if period elapsed
        request.user.check_suspension()
        return not request.user.is_suspended
