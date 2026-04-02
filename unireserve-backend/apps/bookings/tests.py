from datetime import time

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.facilities.models import Facility, FacilitySlot


class BookingFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email='student-booking@example.com',
            password='StrongPass123!',
            first_name='Student',
            last_name='Booking',
            role='STUDENT',
            is_active=True,
        )
        self.manager = User.objects.create_user(
            email='manager-booking@example.com',
            password='StrongPass123!',
            first_name='Manager',
            last_name='Booking',
            role='MANAGER',
            is_active=True,
        )
        self.facility = Facility.objects.create(
            name='Booking Test Room',
            facility_type='STUDY_ROOM',
            building='Library',
            total_capacity=4,
            manager=self.manager,
            requires_approval=False,
        )
        slot_date = timezone.localdate()
        self.slot = FacilitySlot.objects.create(
            facility=self.facility,
            slot_date=slot_date,
            start_time=time(10, 0),
            end_time=time(11, 0),
            available_capacity=4,
        )
        self.client.force_authenticate(self.student)

    def test_facility_availability_and_booking_creation(self):
        facilities_response = self.client.get('/api/v1/facilities/')
        self.assertEqual(facilities_response.status_code, 200)
        self.assertEqual(facilities_response.json()['data'][0]['name'], self.facility.name)

        availability_response = self.client.get(
            f'/api/v1/facilities/{self.facility.id}/availability/',
            {'date': self.slot.slot_date.isoformat()},
        )
        self.assertEqual(availability_response.status_code, 200)
        self.assertEqual(availability_response.json()['data'][0]['id'], str(self.slot.id))

        booking_response = self.client.post(
            '/api/v1/bookings/',
            {
                'facility': str(self.facility.id),
                'slot': str(self.slot.id),
                'group_size': 1,
            },
            format='json',
        )

        self.assertEqual(booking_response.status_code, 201)
        payload = booking_response.json()['data']
        self.assertEqual(payload['facility'], str(self.facility.id))
        self.assertEqual(payload['slot']['facility_name'], self.facility.name)
        self.assertEqual(payload['student']['email'], self.student.email)
