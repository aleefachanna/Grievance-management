from django.urls import path
from .views import submit_complaint
from .views import dep_login
from .views import dep_dashboard
from .views import organisation_stats_api
urlpatterns = [
    path('submit/', submit_complaint, name='submit_complaint'),
    path('dlogin/', dep_login, name='dep_login'),
    path('depdashboard/', dep_dashboard, name='dashboard'),
    path('api/org-stats/<str:cin>/', organisation_stats_api, name='org-stats-api'),
]