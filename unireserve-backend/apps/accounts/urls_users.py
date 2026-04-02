from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.user import MeView, AdminUserViewSet

router = DefaultRouter()
router.register(r'', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('me/', MeView.as_view(), name='user_me'),
    # The router includes /api/v1/users/ and /api/v1/users/<id>/
    # Also includes the custom actions /approve-manager/ and /ban/
    path('', include(router.urls)),
]
