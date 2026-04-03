"""
Email notification helpers for UniReserve.
Uses Django's send_mail — console backend in development, SMTP in production.
"""

from django.core.mail import send_mail
from django.conf import settings


def send_verification_email(user, verification_url):
    """Send email verification link to newly registered student."""
    subject = 'UniReserve — Verify Your Email'
    message = (
        f'Hi {user.name},\n\n'
        f'Welcome to UniReserve! Please verify your email by clicking the link below:\n\n'
        f'{verification_url}\n\n'
        f'This link expires in 24 hours.\n\n'
        f'If you did not create this account, please ignore this email.\n\n'
        f'— The UniReserve Team'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
    except Exception as e:
        # Log but don't block registration
        print(f'[EMAIL ERROR] Failed to send verification email to {user.email}: {e}')


def send_manager_pending_email(user):
    """Notify manager that their registration is pending admin approval."""
    subject = 'UniReserve — Registration Received'
    message = (
        f'Hi {user.name},\n\n'
        f'Your registration as a Facility Manager has been received.\n'
        f'An administrator will review your application shortly.\n\n'
        f'You will receive an email once your account has been approved.\n\n'
        f'— The UniReserve Team'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
    except Exception as e:
        print(f'[EMAIL ERROR] Failed to send pending email to {user.email}: {e}')


def send_manager_approved_email(user):
    """Notify manager that their account has been approved."""
    subject = 'UniReserve — Account Approved!'
    message = (
        f'Hi {user.name},\n\n'
        f'Great news! Your Facility Manager account has been approved.\n'
        f'You can now log in at {settings.FRONTEND_URL}/login\n\n'
        f'— The UniReserve Team'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
    except Exception as e:
        print(f'[EMAIL ERROR] Failed to send approval email to {user.email}: {e}')


def send_manager_rejected_email(user, reason=''):
    """Notify manager that their registration was rejected."""
    subject = 'UniReserve — Registration Update'
    reason_text = f'\nReason: {reason}\n' if reason else ''
    message = (
        f'Hi {user.name},\n\n'
        f'We regret to inform you that your Facility Manager registration has been declined.\n'
        f'{reason_text}\n'
        f'If you believe this is an error, please contact the university administration.\n\n'
        f'— The UniReserve Team'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
    except Exception as e:
        print(f'[EMAIL ERROR] Failed to send rejection email to {user.email}: {e}')


def send_password_reset_email(user, reset_url):
    """Send password reset link."""
    subject = 'UniReserve — Password Reset'
    message = (
        f'Hi {user.name},\n\n'
        f'A password reset was requested for your account.\n'
        f'Click the link below to set a new password:\n\n'
        f'{reset_url}\n\n'
        f'This link expires in 1 hour.\n'
        f'If you did not request this, please ignore this email.\n\n'
        f'— The UniReserve Team'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
    except Exception as e:
        print(f'[EMAIL ERROR] Failed to send password reset email to {user.email}: {e}')
