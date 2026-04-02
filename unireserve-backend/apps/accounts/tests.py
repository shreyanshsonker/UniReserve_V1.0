from django.test import TestCase
from rest_framework.test import APIClient


class AccountFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_student_registration_and_login_flow(self):
        registration_response = self.client.post(
            '/api/v1/auth/register/student/',
            {
                'email': 'student-flow@example.com',
                'password': 'StrongPass123!',
                'first_name': 'Student',
                'last_name': 'Flow',
            },
            format='json',
        )

        self.assertEqual(registration_response.status_code, 201)
        self.assertTrue(registration_response.json()['success'])

        login_response = self.client.post(
            '/api/v1/auth/login/',
            {
                'email': 'student-flow@example.com',
                'password': 'StrongPass123!',
            },
            format='json',
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertIn('refresh_token', login_response.cookies)

        access_token = login_response.json()['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        me_response = self.client.get('/api/v1/users/me/')

        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.json()['data']['email'], 'student-flow@example.com')
