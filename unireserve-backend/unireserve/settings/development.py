from .base import *

DEBUG = env.bool('DEBUG', default=True)

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['127.0.0.1', 'localhost'])

# Use console backend for emails in development if not configured
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# For development purposes, allow all origins
CORS_ALLOW_ALL_ORIGINS = True
