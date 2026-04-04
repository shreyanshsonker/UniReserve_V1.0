from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Facility, FacilitySlot


User = get_user_model()


class FacilityApiTests(APITestCase):
    def create_user(self, **overrides):
        defaults = {
            'email': f"user-{timezone.now().timestamp()}@example.com",
            'password': 'StrongPass123!',
            'name': 'Test User',
            'role': 'manager',
            'is_active': True,
            'account_status': 'active',
        }
        defaults.update(overrides)
        password = defaults.pop('password')
        return User.objects.create_user(password=password, **defaults)

    def create_facility(self, manager, **overrides):
        defaults = {
            'name': 'Central Library Cubicle',
            'type': 'library',
            'location': 'Block A',
            'description': 'Quiet individual study area',
            'manager': manager,
            'capacity_per_slot': 1,
            'is_active': True,
        }
        defaults.update(overrides)
        return Facility.objects.create(**defaults)

    def test_manager_can_create_slot_without_sending_facility_field(self):
        manager = self.create_user(email='manager@example.com', name='Manager One')
        facility = self.create_facility(manager=manager)

        self.client.force_authenticate(user=manager)
        response = self.client.post(
            reverse('slot-list', kwargs={'facility_pk': facility.pk}),
            {
                'date': '2026-04-10',
                'start_time': '09:00',
                'end_time': '10:00',
                'capacity': 10,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['facility'], facility.pk)
        self.assertTrue(
            FacilitySlot.objects.filter(
                facility=facility,
                date='2026-04-10',
                start_time='09:00',
                end_time='10:00',
                capacity=10,
            ).exists()
        )

    def test_manager_cannot_create_slot_for_someone_elses_facility(self):
        owner = self.create_user(email='owner@example.com', name='Owner Manager')
        other_manager = self.create_user(email='other@example.com', name='Other Manager')
        facility = self.create_facility(manager=owner)

        self.client.force_authenticate(user=other_manager)
        response = self.client.post(
            reverse('slot-list', kwargs={'facility_pk': facility.pk}),
            {
                'date': '2026-04-10',
                'start_time': '11:00',
                'end_time': '12:00',
                'capacity': 5,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(FacilitySlot.objects.filter(facility=facility).exists())

    def test_public_facility_list_shows_newest_facilities_first(self):
        manager = self.create_user(email='manager-list@example.com', name='Listing Manager')
        older = self.create_facility(manager=manager, name='Older Facility')
        newer = self.create_facility(manager=manager, name='Newer Facility')

        now = timezone.now()
        Facility.objects.filter(pk=older.pk).update(created_at=now - timedelta(days=1))
        Facility.objects.filter(pk=newer.pk).update(created_at=now)

        response = self.client.get(reverse('facility-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(results[0]['id'], newer.pk)
        self.assertEqual(results[1]['id'], older.pk)

    def test_manager_facility_list_shows_newest_facilities_first(self):
        manager = self.create_user(email='manager-managed@example.com', name='Managed Manager')
        older = self.create_facility(manager=manager, name='Older Managed Facility')
        newer = self.create_facility(manager=manager, name='Newer Managed Facility')

        now = timezone.now()
        Facility.objects.filter(pk=older.pk).update(created_at=now - timedelta(days=1))
        Facility.objects.filter(pk=newer.pk).update(created_at=now)

        self.client.force_authenticate(user=manager)
        response = self.client.get(reverse('manager-facility-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(results[0]['id'], newer.pk)
        self.assertEqual(results[1]['id'], older.pk)
