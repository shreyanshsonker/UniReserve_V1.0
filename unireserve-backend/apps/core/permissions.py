from rest_framework.permissions import BasePermission

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'STUDENT')

class IsManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'MANAGER')

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        # Assumes obj has student, user, or similar field. Handled per model.
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'student'):
            return obj.student == request.user
        return obj == request.user
