from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.facilities.models import Facility
from apps.facilities.services.slot_generator import generate_slots_for_facility


class Command(BaseCommand):
    help = 'Seed a small set of demo users, facilities, and slots for local development.'

    def handle(self, *args, **options):
        password = 'Password123!'
        today = timezone.localdate()

        student, _ = User.objects.get_or_create(
            email='student@unireserve.local',
            defaults={
                'first_name': 'Demo',
                'last_name': 'Student',
                'role': 'STUDENT',
                'is_active': True,
            },
        )
        student.set_password(password)
        student.is_active = True
        student.save(update_fields=['password', 'is_active'])

        manager, _ = User.objects.get_or_create(
            email='manager@unireserve.local',
            defaults={
                'first_name': 'Demo',
                'last_name': 'Manager',
                'role': 'MANAGER',
                'department': 'Campus Operations',
                'is_active': True,
            },
        )
        manager.set_password(password)
        manager.is_active = True
        manager.save(update_fields=['password', 'is_active'])

        admin, _ = User.objects.get_or_create(
            email='admin@unireserve.local',
            defaults={
                'first_name': 'Demo',
                'last_name': 'Admin',
                'role': 'ADMIN',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
            },
        )
        admin.set_password(password)
        admin.is_active = True
        admin.is_staff = True
        admin.is_superuser = True
        admin.save(update_fields=['password', 'is_active', 'is_staff', 'is_superuser'])

        instant_facility, _ = Facility.objects.get_or_create(
            name='North Library Study Pod',
            defaults={
                'facility_type': 'STUDY_ROOM',
                'description': 'A quiet, reservable study room for small groups.',
                'building': 'North Library',
                'floor': '2',
                'room_number': 'N-204',
                'total_capacity': 4,
                'requires_approval': False,
                'slot_duration_mins': 60,
                'manager': manager,
            },
        )

        approval_facility, _ = Facility.objects.get_or_create(
            name='Innovation Lab',
            defaults={
                'facility_type': 'COMPUTER_LAB',
                'description': 'A managed maker-space that requires approval before booking.',
                'building': 'Engineering Block',
                'floor': '1',
                'room_number': 'E-112',
                'total_capacity': 10,
                'requires_approval': True,
                'slot_duration_mins': 60,
                'manager': manager,
            },
        )

        generate_slots_for_facility(instant_facility, today, today + timedelta(days=1))
        generate_slots_for_facility(approval_facility, today, today + timedelta(days=1))

        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully.'))
        self.stdout.write('Student: student@unireserve.local / Password123!')
        self.stdout.write('Manager: manager@unireserve.local / Password123!')
        self.stdout.write('Admin:   admin@unireserve.local / Password123!')
