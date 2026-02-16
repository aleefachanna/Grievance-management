from django.urls import path
<<<<<<< HEAD
from .views import submit_complaint
from .views import dep_login
from .views import dep_dashboard

urlpatterns = [
    path('submit/', submit_complaint, name='submit_complaint'),
    path('dlogin/', dep_login, name='dep_login'),
    path('depdashboard/', dep_dashboard, name='dashboard'),


=======
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, SubmitComplaintView, DashboardView

urlpatterns = [
    # Auth Routes
    path('login/', LoginView.as_view(), name='api_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Feature Routes
    path('submit/', SubmitComplaintView.as_view(), name='api_submit_complaint'),
    path('dashboard/', DashboardView.as_view(), name='api_dashboard'),
>>>>>>> 87abd6fcad52e76ae047c27804f9dbdd77076ea7
]