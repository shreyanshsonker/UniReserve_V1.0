from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from apps.core.utils.tokens import generate_verification_token
from apps.accounts.models import EmailVerification, ManagerApprovalRequest
from apps.core.exceptions import BusinessLogicException
from django.contrib.auth import get_user_model

User = get_user_model()

def prepare_student_registration(user):
    """
    Creates an email verification token. In a real app, this dispatches a Celery task to email.
    """
    if settings.DEBUG or getattr(settings, 'TESTING', False):
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=['is_active'])
        return

    token = generate_verification_token()
    EmailVerification.objects.create(
        user=user,
        token=token,
        token_type='EMAIL_VERIFY',
        expires_at=timezone.now() + timedelta(hours=24)
    )
    # TODO: dispatch celery task send_verification_email.delay(user.id, token)

def prepare_manager_registration(user, facility_name=None):
    """
    Creates a pending request.
    """
    if settings.DEBUG or getattr(settings, 'TESTING', False):
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=['is_active'])
        return

    ManagerApprovalRequest.objects.create(
        user=user,
        status='PENDING'
    )
    # TODO: dispatch celery task request to admin.

def verify_email_token(token_str):
    try:
        ev = EmailVerification.objects.get(token=token_str, token_type='EMAIL_VERIFY', used_at__isnull=True)
    except EmailVerification.DoesNotExist:
        raise BusinessLogicException('Invalid or already used token.', 'INVALID_TOKEN', 400)

    if ev.expires_at < timezone.now():
        raise BusinessLogicException('Token has expired.', 'TOKEN_EXPIRED', 400)

    ev.used_at = timezone.now()
    ev.save()

    user = ev.user
    user.is_active = True
    user.save(update_fields=['is_active'])
    return user

def process_manager_approval(request_id, admin_user, approve=True, reason=None):
    try:
        req = ManagerApprovalRequest.objects.get(id=request_id, status='PENDING')
    except ManagerApprovalRequest.DoesNotExist:
        raise BusinessLogicException("Request not found or already processed.", "INVALID_REQUEST", 404)

    req.status = 'APPROVED' if approve else 'REJECTED'
    req.approved_by = admin_user
    if reason:
        req.rejection_reason = reason
    req.save()

    if approve:
        user = req.user
        user.is_active = True
        user.save(update_fields=['is_active'])

    # TODO: email worker notification
    return req

def prepare_password_reset(email):
    try:
        user = User.objects.get(email=email)
        from apps.core.utils.tokens import generate_verification_token
        token = generate_verification_token()
        EmailVerification.objects.create(
            user=user,
            token=token,
            token_type='PASSWORD_RESET',
            expires_at=timezone.now() + timedelta(hours=1)
        )
        # TODO: send instruction email
    except User.DoesNotExist:
        pass # Silent fail for security

def confirm_password_reset(token_str, new_password):
    try:
        ev = EmailVerification.objects.get(token=token_str, token_type='PASSWORD_RESET', used_at__isnull=True)
    except EmailVerification.DoesNotExist:
        raise BusinessLogicException('Invalid or already used token.', 'INVALID_TOKEN', 400)

    if ev.expires_at < timezone.now():
        raise BusinessLogicException('Token has expired.', 'TOKEN_EXPIRED', 400)

    user = ev.user
    user.set_password(new_password)
    user.save()

    ev.used_at = timezone.now()
    ev.save()
