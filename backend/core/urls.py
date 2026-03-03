from django.urls import path
from rest_framework.routers import DefaultRouter
from .department import (
    LoginView,
    AIAssignView, 
    DepartmentAnalyzeView, 
    DepartmentWorkViewSet,
    DepartmentComplaintViewSet,
    DepartmentDashboardView)
from .views import (
    get_organisation,
    search_organisations,
    manager_login,
    track_complaint,
    SubmitComplaintView,
    ManagerDashboardView,
)
router = DefaultRouter()
router.register(r"department/complaints", DepartmentComplaintViewSet, basename="dept-complaints")
router.register(r"department/works", DepartmentWorkViewSet, basename="dept-works")

urlpatterns = [
    
    # ---------------- Public Organisation APIs ----------------
    path('organisation/<slug:slug>/', get_organisation, name='get_organisation'),
    path('organisations/search/', search_organisations, name='search_organisations'),
    # ---------------- Manager Login ----------------
    path('manager/login/', manager_login, name='manager_login'),

    # ---------------- Employee Login (JWT) ----------------
    

    # ---------------- Complaint Tracking ----------------
    path('complaint/track/<str:complaint_id>/', track_complaint, name='track_complaint'),

    # ---------------- Complaint Submission ----------------
    path('complaint/submit/', SubmitComplaintView.as_view(), name='submit_complaint'),

    # ---------------- Department Dashboard ----------------
    path('department/login/', LoginView.as_view()),
    path("department/dashboard/", DepartmentDashboardView.as_view()),
    path("department/ai/assign/", AIAssignView.as_view()),
    path("department/analyze/", DepartmentAnalyzeView.as_view()),

    # ---------------- Manager Dashboard ----------------
    path('dashboard/manager/', ManagerDashboardView.as_view(), name='manager_dashboard'),
]
urlpatterns += router.urls