"""
Root URL configuration for UniReserve backend.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/facilities/', include('facilities.urls')),
    path('api/bookings/', include('bookings.urls')),
]
