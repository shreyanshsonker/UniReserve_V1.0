from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.waitlist import WaitlistViewSet

router = DefaultRouter()
router.register(r'', WaitlistViewSet, basename='waitlists')

urlpatterns = [
    path('', include(router.urls)),
]
