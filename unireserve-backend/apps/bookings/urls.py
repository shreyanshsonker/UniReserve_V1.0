from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.booking import BookingViewSet

router = DefaultRouter()
router.register(r'', BookingViewSet, basename='bookings')

urlpatterns = [
    path('', include(router.urls)),
]
