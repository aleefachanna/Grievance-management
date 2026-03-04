from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, ManagerDashboardView, SubmitComplaintView, DepartmentDashboardView, track_complaint

urlpatterns = [
    # Auth Routes
    path('emplogin/', LoginView.as_view(), name='api_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Feature Routes
    path('submit/', SubmitComplaintView.as_view(), name='api_submit_complaint'),
    path('department/dashboard/', DepartmentDashboardView.as_view(), name='api_dashboard'),
    path("manager/dashboard/", ManagerDashboardView.as_view()),
    # urls.py
    path('track/<str:complaint_id>/', track_complaint),
]