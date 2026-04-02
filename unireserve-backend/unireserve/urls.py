from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Apps routing schema
    path('api/v1/auth/', include('apps.accounts.urls_auth')),
    path('api/v1/users/', include('apps.accounts.urls_users')),
    path('api/v1/facilities/', include('apps.facilities.urls')),
    path('api/v1/bookings/', include('apps.bookings.urls')),
    path('api/v1/waitlist/', include('apps.bookings.urls_waitlist')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
]
