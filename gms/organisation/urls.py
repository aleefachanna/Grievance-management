from django.urls import path
from . import views

urlpatterns = [
    path('add/', views.organisation_create, name='org_add'),
    path('success/', views.success, name='success'),
]
