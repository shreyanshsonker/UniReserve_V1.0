from .base import *

DEBUG = False

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Define trusted origins for CORS
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
