from django.urls import path
from . import views

urlpatterns = [
    # Student browsing / Public access
    path('', views.FacilityListView.as_view(), name='facility-list'),
    path('<int:pk>/', views.FacilityDetailView.as_view(), name='facility-detail'),
    path('<int:facility_pk>/slots/', views.FacilitySlotListView.as_view(), name='slot-list'),
    
    # Manager access
    path('managed/', views.ManagerFacilityListView.as_view(), name='manager-facility-list'),
    path('slots/<int:pk>/toggle-block/', views.SlotBlockToggleView.as_view(), name='slot-toggle-block'),
]
