from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.accounts.models import EmailVerification

User = get_user_model()

@shared_task
def auto_unban_users():
    """
    Reverts is_banned to False if ban_until has passed.
    """
    now = timezone.now()
    banned_users = User.objects.filter(is_banned=True, ban_until__lt=now)
    
    for user in banned_users:
        user.is_banned = False
        user.ban_until = None
        user.no_show_count = 0 # Reset count after serving ban
        user.save(update_fields=['is_banned', 'ban_until', 'no_show_count'])

@shared_task
def cleanup_expired_tokens():
    """
    Deletes email verifications that expired over 24h ago to keep table clean.
    """
    now = timezone.now()
    cutoff = now - timezone.timedelta(hours=24)
    EmailVerification.objects.filter(expires_at__lt=cutoff).delete()
