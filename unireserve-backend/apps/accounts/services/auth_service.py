from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.utils import timezone
from apps.core.exceptions import BusinessLogicException

def get_tokens_for_user(user):
    if not user.is_active:
        raise BusinessLogicException('Account is not active. Please check your email for verification.', 'ACCOUNT_INACTIVE', 403)
    if user.is_banned:
        if user.ban_until and user.ban_until > timezone.now():
            raise BusinessLogicException(f'Account is banned until {user.ban_until.strftime("%B %d, %Y")}.', 'ACCOUNT_BANNED', 403)
        elif not user.ban_until:
             raise BusinessLogicException('Account is permanently banned.', 'ACCOUNT_BANNED', 403)

    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])

    refresh = RefreshToken.for_user(user)
    # Add claims inside the token. Note: Add them mostly in CustomTokenObtainPairSerializer if needed natively,
    # but since we generate tokens manually in view, we can just return standard or modify payload.
    refresh['role'] = user.role
    refresh['is_banned'] = user.is_banned

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def blacklist_refresh_token(refresh_token):
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        pass # Already backlisted or invalid, fine to ignore for logout
