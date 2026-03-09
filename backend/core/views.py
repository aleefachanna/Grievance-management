from django.conf import settings
from django.core.mail import EmailMessage
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Case, When, Value, IntegerField
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.db import transaction
import secrets
from datetime import timedelta
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from django.utils.text import slugify
from .models import Complaint, Department, DepartmentWork, Employee, Manager, Organisation
from .serializers import (
    ComplaintDetailSerializer,
    ComplaintCreateSerializer,
    DepartmentWorkSerializer,
    OrganisationSerializer,
    ComplaintTrackSerializer
)
from .service import classify_and_summarize

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"message": "Logged out successfully"})
@api_view(['GET'])
def track_complaint(request, complaint_id):
    complaint = get_object_or_404(Complaint, complaint_id=complaint_id)
    serializer = ComplaintTrackSerializer(complaint)
    return Response(serializer.data)



def send_email(subject: str, body: str, to_email: str):
    """Send email using Django EmailMessage."""
    mail = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email]
    )
    mail.send(fail_silently=False)

@api_view(['GET'])
def get_organisation(request, slug: str):
    org = get_object_or_404(Organisation, slug=slug, is_active=True)
    org_data = OrganisationSerializer(org).data
    
    # Also fetch recent active complaints for accountability transparency
    complaints = Complaint.objects.filter(organisation=org).order_by('-created_at')[:20]
    org_data['recent_complaints'] = ComplaintTrackSerializer(complaints, many=True).data

    # Add statistics
    total_complaints = Complaint.objects.filter(organisation=org).count()
    resolved_complaints = Complaint.objects.filter(organisation=org, status="CLOSED").count()
    total_departments = Department.objects.filter(organisation=org).count()
    total_employees = Employee.objects.filter(organisation=org).count()
    
    org_data['stats'] = {
        'total_complaints': total_complaints,
        'resolved_complaints': resolved_complaints,
        'total_departments': total_departments,
        'total_employees': total_employees
    }
    
    departments = Department.objects.filter(organisation=org)
    org_data['departments'] = [{"id": str(d.id), "name": d.name} for d in departments]

    return Response(org_data)



@api_view(['GET'])
def search_organisations(request):
    query = request.GET.get('q', '')
    
    # If query exists, filter; otherwise, get all
    if query:
        orgs = Organisation.objects.filter(
            Q(name__icontains=query) | Q(city__icontains=query),
            is_active=True
        )
    else:
        orgs = Organisation.objects.filter(is_active=True)

    results = [
        {
            'id': str(org.id),
            'name': org.name,
            'slug': org.slug,
            'type': org.get_organisation_type_display(),
            'location': f"{org.city}, {org.country}"
        } 
        for org in orgs
    ]

    return Response({'results': results}) # Use Response instead of JsonResponse
# =========================================================
# MANAGER LOGIN (JWT ENABLED)
# =========================================================
def create_employee(data):

    temp_password = secrets.token_urlsafe(8)

    user = User.objects.create(
        username=data["employee_id"],
        email=data["email"],
        password=make_password(temp_password),
        first_name=data["name"]
    )

    Employee.objects.create(
        user=user,
        organisation=data["organisation"],
        department=data.get("department"),
        employee_id=data["employee_id"],
        password=make_password(temp_password)
    )

    return temp_password

@api_view(['POST'])
def manager_login(request):
    email = request.data.get("email")
    password = request.data.get("password", "")

    try:
        manager = Manager.objects.get(user__email=email)

        if not manager.user.check_password(password):
            raise Manager.DoesNotExist

        refresh = RefreshToken.for_user(manager.user)

        return Response({
            "message": "Login successful",
            "manager_id": str(manager.id),
            "organisation_id": str(manager.organisation.id),
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        })

    except Manager.DoesNotExist:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

class SubmitComplaintView(APIView):
    """
    Public complaint submission endpoint.
    Saves complaint first, then processes AI.
    """

    def get(self, request):
        orgs = Organisation.objects.filter(is_active=True)
        serializer = OrganisationSerializer(orgs, many=True)
        return Response(serializer.data)

    @transaction.atomic
    def post(self, request):

        serializer = ComplaintCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        organisation = serializer.validated_data["organisation"]
        description = serializer.validated_data["description"]
        email = request.data.get("email")

        complaint = Complaint.objects.create(
            organisation=organisation,
            description=description,
            user_email=email,
            attachment=request.FILES.get("attachment")
        )

        dept_queryset = Department.objects.filter(organisation=organisation)
        dept_names = list(dept_queryset.values_list("name", flat=True))

        ai_status = "success"

        try:
            ai_result = classify_and_summarize(description, dept_names)

            summary = ai_result.get("summary", "")
            severity = str(ai_result.get("severity", "0"))
            departments = ai_result.get("departments", [])

            if severity not in ["0", "1", "2", "3", "4", "5"]:
                severity = "0"

            complaint.ai_summary = summary
            complaint.severity = severity

            if departments:
                dept_obj = Department.objects.filter(
                    organisation=organisation,
                    name__in=departments
                ).first()
                if dept_obj:
                    complaint.department = dept_obj
                    
            # Calculate SLA deadline
            deadline_map = {"5": 1, "4": 3, "3": 7, "2": 14, "1": 30, "0": 30}
            days = deadline_map.get(severity, 30)
            complaint.deadline = timezone.now() + timedelta(days=days)

            complaint.save()

        except Exception as e:
            ai_status = f"failed: {str(e)}"
            complaint.severity = "0"
            complaint.deadline = timezone.now() + timedelta(days=30)
            complaint.save()

        email_body = f"""
Hello,

Your complaint has been registered successfully.

Complaint ID: {complaint.complaint_id}
Organisation: {organisation.name}
Severity Level: {complaint.severity}

We will review your complaint shortly.
"""

        if email:
            send_email("Complaint Registered Successfully", email_body, email)

        return Response({
            "message": "Complaint submitted successfully",
            "ai_status": ai_status,
            "complaint_id": complaint.complaint_id
        }, status=status.HTTP_201_CREATED)


class ManagerDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        manager = get_object_or_404(Manager, user=request.user)
        org = manager.organisation

        departments = Department.objects.filter(organisation=org)
        complaints = Complaint.objects.filter(organisation=org)
        works = DepartmentWork.objects.filter(
            department__organisation=org
        )

        return Response({
            "organisation": org.name,
            "stats": {
                "total_complaints": complaints.count(),
                "pending_complaints": complaints.exclude(status="CLOSED").count(),
                "total_departments": departments.count()
            },
            "departments": [{"id": d.id, "name": d.name} for d in departments],
            "complaints": ComplaintDetailSerializer(complaints, many=True).data,
            "works": DepartmentWorkSerializer(works, many=True).data
        })

    def post(self, request):

        manager = get_object_or_404(Manager, user=request.user)
        org = manager.organisation
        action = request.data.get("action")

        if action == "reassign_complaint":
            complaint = get_object_or_404(
                Complaint,
                id=request.data.get("complaint_id"),
                organisation=org
            )

            department = get_object_or_404(
                Department,
                id=request.data.get("department_id"),
                organisation=org
            )

            complaint.department = department
            complaint.save()

            return Response({"message": "Complaint reassigned"})

        return Response({"error": "Invalid action"}, status=400)


class CreateOrganisationView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data
        
        name = data.get("orgName")
        slug = slugify(name)
        base_slug = slug
        counter = 1
        while Organisation.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
            
        org = Organisation.objects.create(
            name=name,
            slug=slug,
            organisation_type="private",
            official_email=data.get("email"),
            city=data.get("city"),
            state=data.get("state"),
            country=data.get("country"),
            description=data.get("address", "")
        )
        
        admin_email = data.get("adminEmail")
        temp_password = secrets.token_urlsafe(8)
        
        user = User.objects.create(
            username=admin_email,
            email=admin_email,
            password=make_password(temp_password),
            first_name=data.get("adminName", "")
        )
        
        manager = Manager.objects.create(
            user=user,
            organisation=org,
            is_owner=True
        )
        
        return Response({
            "message": "Organisation created successfully",
            "manager_email": admin_email,
            "password": temp_password,
            "organisation_slug": org.slug
        }, status=status.HTTP_201_CREATED)

class DepartmentManagerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        manager = get_object_or_404(Manager, user=request.user)
        departments = Department.objects.filter(organisation=manager.organisation)
        return Response([{"id": str(d.id), "name": d.name, "description": d.description} for d in departments])

    def post(self, request):
        manager = get_object_or_404(Manager, user=request.user)
        name = request.data.get("name")
        description = request.data.get("description", "")
        
        if Department.objects.filter(organisation=manager.organisation, name=name).exists():
            return Response({"error": "Department with this name already exists"}, status=400)
            
        dept = Department.objects.create(
            organisation=manager.organisation,
            name=name,
            description=description
        )
        return Response({"id": str(dept.id), "name": dept.name, "description": dept.description}, status=201)

class EmployeeManagerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        manager = get_object_or_404(Manager, user=request.user)
        employees = Employee.objects.filter(organisation=manager.organisation)
        return Response([{
            "id": str(e.id),
            "employee_id": e.employee_id,
            "name": e.user.first_name,
            "email": e.user.email,
            "department": e.department.name if e.department else None,
            "department_id": str(e.department.id) if e.department else None,
            "is_hod": e.isHod,
            "is_active": e.is_active
        } for e in employees])

    @transaction.atomic
    def post(self, request):
        manager = get_object_or_404(Manager, user=request.user)
        data = request.data
        
        dept_id = data.get("department_id")
        dept = get_object_or_404(Department, id=dept_id, organisation=manager.organisation)
        
        email = data.get("email")
        if User.objects.filter(username=email).exists():
            return Response({"error": "User with this email already exists"}, status=400)
            
        temp_password = secrets.token_urlsafe(8)
        
        user = User.objects.create(
            username=email,
            email=email,
            password=make_password(temp_password),
            first_name=data.get("name", "")
        )
        
        employee_id = f"EMP-{manager.organisation.slug[:3].upper()}-{secrets.token_hex(2).upper()}"
        
        emp = Employee.objects.create(
            user=user,
            organisation=manager.organisation,
            department=dept,
            employee_id=employee_id,
            isHod=data.get("is_hod", False)
        )
        
        return Response({
            "message": "Employee created successfully",
            "employee_id": emp.employee_id,
            "email": user.email,
            "password": temp_password
        }, status=201)
