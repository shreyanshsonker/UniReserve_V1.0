from django.urls import path
from .views.auth import LoginView, LogoutView, TokenRefreshView, PasswordResetRequestView, PasswordResetConfirmView
from .views.registration import StudentRegisterView, ManagerRegisterView, VerifyEmailView

urlpatterns = [
    path('register/student/', StudentRegisterView.as_view(), name='register_student'),
    path('register/manager/', ManagerRegisterView.as_view(), name='register_manager'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
