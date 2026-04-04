from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from facilities.models import Facility, FacilitySlot
from .models import Booking


User = get_user_model()


class BookingApprovalFlowTests(APITestCase):
    def create_user(self, *, email, role, name):
        return User.objects.create_user(
            email=email,
            password='StrongPass123!',
            name=name,
            role=role,
            is_active=True,
            account_status='active',
        )

    def create_slot(self, *, manager, capacity=1):
        facility = Facility.objects.create(
            name='Reading Hall',
            type='library',
            description='Quiet study area',
            location='Block A',
            manager=manager,
            capacity_per_slot=capacity,
            is_active=True,
        )
        slot = FacilitySlot.objects.create(
            facility=facility,
            date='2026-04-15',
            start_time='10:00',
            end_time='11:00',
            capacity=capacity,
        )
        return facility, slot

    def test_student_booking_creates_pending_request_for_facility_manager(self):
        manager = self.create_user(email='manager@example.com', role='manager', name='Facility Manager')
        student = self.create_user(email='student@example.com', role='student', name='Student One')
        facility, slot = self.create_slot(manager=manager, capacity=2)

        self.client.force_authenticate(user=student)
        response = self.client.post(reverse('booking-create'), {'slot_id': slot.pk}, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending_approval')
        slot.refresh_from_db()
        self.assertEqual(slot.current_bookings, 1)

        self.client.force_authenticate(user=manager)
        approvals_response = self.client.get(reverse('manager-pending-approvals'))

        self.assertEqual(approvals_response.status_code, status.HTTP_200_OK)
        self.assertEqual(approvals_response.data['results'][0]['facility_name'], facility.name)
        self.assertEqual(approvals_response.data['results'][0]['user_name'], student.name)

    def test_pending_requests_reserve_capacity_for_the_slot(self):
        manager = self.create_user(email='manager-cap@example.com', role='manager', name='Capacity Manager')
        first_student = self.create_user(email='student-a@example.com', role='student', name='Student A')
        second_student = self.create_user(email='student-b@example.com', role='student', name='Student B')
        _, slot = self.create_slot(manager=manager, capacity=1)

        self.client.force_authenticate(user=first_student)
        first_response = self.client.post(reverse('booking-create'), {'slot_id': slot.pk}, format='json')
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=second_student)
        second_response = self.client.post(reverse('booking-create'), {'slot_id': slot.pk}, format='json')

        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already full', second_response.data['error'])

    def test_facility_owner_approval_activates_booking_without_double_counting(self):
        manager = self.create_user(email='manager-approve@example.com', role='manager', name='Approver')
        student = self.create_user(email='student-approve@example.com', role='student', name='Student Approval')
        _, slot = self.create_slot(manager=manager, capacity=1)

        self.client.force_authenticate(user=student)
        create_response = self.client.post(reverse('booking-create'), {'slot_id': slot.pk}, format='json')
        booking_id = create_response.data['id']

        self.client.force_authenticate(user=manager)
        approve_response = self.client.patch(
            reverse('booking-approval-action', kwargs={'pk': booking_id}),
            {'action': 'approve', 'note': 'Approved by facility owner.'},
            format='json',
        )

        self.assertEqual(approve_response.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_response.data['status'], 'active')
        slot.refresh_from_db()
        self.assertEqual(slot.current_bookings, 1)

    def test_student_can_request_same_slot_again_after_cancelling(self):
        manager = self.create_user(email='manager-rebook@example.com', role='manager', name='Rebook Manager')
        student = self.create_user(email='student-rebook@example.com', role='student', name='Student Rebook')
        _, slot = self.create_slot(manager=manager, capacity=1)

        self.client.force_authenticate(user=student)
        first_response = self.client.post(reverse('booking-create'), {'slot_id': slot.pk}, format='json')
        booking_id = first_response.data['id']

        cancel_response = self.client.patch(
            reverse('booking-cancel', kwargs={'pk': booking_id}),
            format='json',
        )
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)

        second_response = self.client.post(reverse('booking-create'), {'slot_id': slot.pk}, format='json')

        self.assertEqual(second_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.data['status'], 'pending_approval')
        self.assertEqual(
            Booking.objects.filter(user=student, slot=slot, status='pending_approval').count(),
            1,
        )

    def test_non_owner_manager_cannot_approve_booking_request(self):
        owner = self.create_user(email='owner@example.com', role='manager', name='Owner Manager')
        other_manager = self.create_user(email='other-manager@example.com', role='manager', name='Other Manager')
        student = self.create_user(email='student-owner@example.com', role='student', name='Student Owner')
        _, slot = self.create_slot(manager=owner, capacity=1)

        self.client.force_authenticate(user=student)
        create_response = self.client.post(reverse('booking-create'), {'slot_id': slot.pk}, format='json')
        booking_id = create_response.data['id']

        self.client.force_authenticate(user=other_manager)
        approve_response = self.client.patch(
            reverse('booking-approval-action', kwargs={'pk': booking_id}),
            {'action': 'approve'},
            format='json',
        )

        self.assertEqual(approve_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Booking.objects.get(pk=booking_id).status, 'pending_approval')
