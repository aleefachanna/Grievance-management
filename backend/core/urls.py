from django.urls import path
from .views import submit_complaint

urlpatterns = [
    path('submit/', submit_complaint, name='submit_complaint'),
]