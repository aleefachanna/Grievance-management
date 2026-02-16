from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_organisation, name='create_organisation'),
    path("search-organisations/", views.search_organisations),
    path('success/', views.organisation_success, name='success'),
    path("organisation/<slug:slug>/", views.get_organisation),
]
