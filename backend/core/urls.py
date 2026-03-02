from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, SubmitComplaintView, DashboardView

urlpatterns = [
    # Auth Routes
    path('login/', LoginView.as_view(), name='api_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Feature Routes
    path('submit/', SubmitComplaintView.as_view(), name='api_submit_complaint'),
    path('dashboard/', DashboardView.as_view(), name='api_dashboard'),
]