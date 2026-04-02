from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from apps.notifications.models import Notification
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

@shared_task
def send_email_notification(notification_id):
    """
    Sends email for a specific notification record.
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        user = notification.user
        
        send_mail(
            subject=notification.title,
            message=notification.body,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@unireserve.com',
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        notification.sent_via_email = True
        notification.email_sent_at = timezone.now()
        notification.save(update_fields=['sent_via_email', 'email_sent_at'])
        
    except Notification.DoesNotExist:
        pass

@shared_task
def create_system_notification(user_id, type_choice, title, body, booking_id=None, send_email=True):
    notification = Notification.objects.create(
        user_id=user_id,
        notification_type=type_choice,
        title=title,
        body=body,
        related_booking_id=booking_id
    )
    if send_email:
        send_email_notification.delay(notification.id)
