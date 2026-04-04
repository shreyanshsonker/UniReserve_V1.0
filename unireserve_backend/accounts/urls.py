"""
URL patterns for the accounts app.
"""

from django.urls import path
from . import views

urlpatterns = [
    # ── Registration ──
    path('register/student/', views.StudentRegisterView.as_view(), name='student-register'),
    path('register/manager/', views.ManagerRegisterView.as_view(), name='manager-register'),

    # ── Email Verification ──
    path('verify/<str:token>/', views.EmailVerifyView.as_view(), name='email-verify'),

    # ── Login & Token ──
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token-refresh'),

    # ── Password Reset ──
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # ── Profile ──
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),

    # ── Admin: Manager Approval ──
    path('admin/pending-managers/', views.PendingManagersListView.as_view(), name='pending-managers'),
    path('admin/approve-manager/<int:pk>/', views.ApproveManagerView.as_view(), name='approve-manager'),
    path('admin/reject-manager/<int:pk>/', views.RejectManagerView.as_view(), name='reject-manager'),

    # ── Admin: User Management ──
    path('admin/users/', views.UserListView.as_view(), name='user-list'),
    path('admin/users/<int:pk>/toggle-active/', views.ToggleUserActiveView.as_view(), name='toggle-user-active'),
    path('admin/users/<int:pk>/clear-warnings/', views.ClearWarningsView.as_view(), name='clear-warnings'),
]
