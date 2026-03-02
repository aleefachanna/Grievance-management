from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_organisation, name='create_organisation'),
    path('success/', views.organisation_success, name='success'),
    path('dashboard/', views.organisation_dashboard, name='org_dashboard'),

]
