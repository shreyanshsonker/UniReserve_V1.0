from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'name', 'role', 'is_active', 'is_suspended', 'no_show_count', 'date_joined')
    list_filter = ('role', 'is_active', 'is_suspended', 'account_status')
    search_fields = ('email', 'name', 'student_id', 'employee_id')
    ordering = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'role', 'department')}),
        ('Student Fields', {'fields': ('student_id', 'year_of_study')}),
        ('Manager Fields', {'fields': ('employee_id', 'facility_responsible_for')}),
        ('Status', {'fields': ('is_active', 'is_staff', 'is_superuser', 'account_status')}),
        ('Enforcement', {'fields': ('no_show_count', 'is_suspended', 'suspended_until')}),
        ('Dates', {'fields': ('date_joined', 'last_login')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'role', 'password1', 'password2', 'is_active', 'is_staff'),
        }),
    )
