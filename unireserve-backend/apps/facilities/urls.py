from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.facility import FacilityViewSet
from .views.slot import FacilitySlotViewSet
from .views.availability import AvailabilityView

router = DefaultRouter()
router.register(r'slots', FacilitySlotViewSet, basename='facility-slots')
router.register(r'', FacilityViewSet, basename='facilities')

urlpatterns = [
    path('<str:facility_id>/availability/', AvailabilityView.as_view(), name='facility_availability'),
    path('', include(router.urls)),
]
