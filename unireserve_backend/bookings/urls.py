from django.urls import path
from . import views
from . import analytics_views

urlpatterns = [
    # Student Booking actions
    path('bookings/', views.BookingCreateView.as_view(), name='booking-create'),
    path('bookings/my/', views.MyBookingsView.as_view(), name='my-bookings'),
    path('bookings/<int:pk>/cancel/', views.BookingCancelView.as_view(), name='booking-cancel'),
    
    # Manager Approval actions
    path('approvals/', views.ManagerPendingApprovalsView.as_view(), name='manager-pending-approvals'),
    path('approvals/<int:pk>/action/', views.BookingApprovalActionView.as_view(), name='booking-approval-action'),
    
    # Waitlist actions
    path('waitlist/', views.WaitlistJoinView.as_view(), name='waitlist-join'),
    path('waitlist/my/', views.MyWaitlistView.as_view(), name='my-waitlist'),
    path('waitlist/<int:pk>/leave/', views.WaitlistLeaveView.as_view(), name='waitlist-leave'),
    path('recommendations/', views.RecommendationListView.as_view(), name='user-recommendations'),
    path('bookings/<int:pk>/check-in/', views.BookingCheckInView.as_view(), name='booking-check-in'),
    path('system/process-no-shows/', views.ProcessNoShowsView.as_view(), name='process-no-shows'),

    # Analytics
    path('analytics/manager/', analytics_views.ManagerAnalyticsView.as_view(), name='manager-analytics'),
    path('analytics/admin/', analytics_views.SuperAdminAnalyticsView.as_view(), name='admin-analytics'),
]
