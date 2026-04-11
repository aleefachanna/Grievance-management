import random
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.core.mail import EmailMessage
from django.db import transaction
from django.db.models import Count, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status

import base64
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Complaint,
    ComplaintUpdate,
    Department,
    DepartmentWork,
    Employee,
    Manager,
    Organisation,
    OTPVerification,
)
from .serializers import (
    ComplaintCreateSerializer,
    ComplaintDetailSerializer,
    ComplaintTrackSerializer,
    DepartmentWorkSerializer,
    OrganisationSerializer,
    EmployeeSerializer,
)
from .service import ai_assign_works, classify_and_summarize, summarize_department_work


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

        attachment = request.FILES.get("attachment")
        complaint = Complaint.objects.create(
            organisation=organisation,
            description=description,
            user_email=email,
            attachment=attachment
        )

        dept_queryset = Department.objects.filter(organisation=organisation)
        dept_info = list(dept_queryset.values("name", "description"))

        attachment_type = None
        attachment_data = None
        if attachment:
            try:
                attachment.seek(0)
                content_type = attachment.content_type
                if content_type and content_type.startswith('image/'):
                    attachment_data = base64.b64encode(attachment.read()).decode('utf-8')
                    attachment_type = "image"
                elif content_type and content_type.startswith('text/'):
                    attachment_data = attachment.read().decode('utf-8', errors='ignore')
                    attachment_type = "text"
            except Exception as e:
                print(f"Error processing attachment: {e}")

        ai_status = "success"

        try:
            ai_result = classify_and_summarize(
                description, 
                dept_info, 
                attachment_type, 
                attachment_data, 
                severity_guidelines=organisation.description
            )

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

        severity_labels = {'0': 'None', '1': 'Very Low', '2': 'Low', '3': 'Medium', '4': 'High', '5': 'Critical'}
        severity_label = severity_labels.get(complaint.severity, complaint.severity)
        deadline_str = complaint.deadline.strftime('%d %b %Y, %I:%M %p UTC') if complaint.deadline else 'Not assigned'
        dept_name = complaint.department.name if complaint.department else 'Being assigned'

        email_body = f"""Hello,

Thank you for reaching out. Your complaint has been successfully registered with {organisation.name}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COMPLAINT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Complaint ID  : {complaint.complaint_id}
  Organisation  : {organisation.name}
  Department    : {dept_name}
  Severity      : {severity_label}
  SLA Deadline  : {deadline_str}
  Status        : Pending Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can track the status of your complaint using the Complaint ID above at any time.

Our team will review your complaint and update you as it progresses.

Regards,
ResolvePro – Grievance Management Platform
"""

        if email:
            try:
                send_email("Complaint Registered – " + complaint.complaint_id, email_body, email)
            except Exception:
                pass  # Don't fail the request if email sending fails

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
        complaints = Complaint.objects.filter(organisation=org).order_by("-created_at")
        works = DepartmentWork.objects.filter(department__organisation=org).order_by("-created_at")

        return Response({
            "organisation": org.name,
            "organisation_description": org.description,
            "stats": {
                "total_complaints": complaints.count(),
                "pending_complaints": complaints.exclude(status="CLOSED").count(),
                "total_departments": departments.count()
            },
            "departments": [{"id": str(d.id), "name": d.name, "description": d.description} for d in departments],
            "complaints": ComplaintDetailSerializer(complaints, many=True).data,
            "works": DepartmentWorkSerializer(works, many=True).data
        })

    def post(self, request):
        manager = get_object_or_404(Manager, user=request.user)
        org = manager.organisation
        action = request.data.get("action")

        if action == "reassign_complaint":
            complaint_id_raw = request.data.get("complaint_id")
            dept_id = request.data.get("department_id")
            
            complaint = Complaint.objects.filter(complaint_id=complaint_id_raw, organisation=org).first()
            if not complaint:
                try:
                    import uuid
                    uuid_val = uuid.UUID(str(complaint_id_raw))
                    complaint = Complaint.objects.filter(id=uuid_val, organisation=org).first()
                except ValueError:
                    pass
            
            if not complaint:
                return Response({"error": "Complaint not found"}, status=404)

            department = get_object_or_404(Department, id=dept_id, organisation=org)

            complaint.department = department
            complaint.save()

            return Response({"message": "Complaint successfully reassigned"})

        if action == "assign_complaint_employee":
            complaint_id_raw = request.data.get("complaint_id")
            emp_ids = request.data.get("employee_ids", [])
            
            complaint = Complaint.objects.filter(complaint_id=complaint_id_raw, organisation=org).first()
            if not complaint:
                try:
                    import uuid
                    uuid_val = uuid.UUID(str(complaint_id_raw))
                    complaint = Complaint.objects.filter(id=uuid_val, organisation=org).first()
                except ValueError:
                    pass
            
            if not complaint:
                return Response({"error": "Complaint not found"}, status=404)

            if not isinstance(emp_ids, list):
                emp_ids = [emp_ids]
                
            emps = Employee.objects.filter(id__in=emp_ids, organisation=org)
            if emps.exists():
                complaint.assigned_employees.set(emps)
                
            return Response({"message": "Employees assigned successfully to complaint"})

        if action == "generate_ai_summary":
            from .service import summarize_organisation_complaints
            
            # Take up to 50 recent complaints for analysis to avoid huge context sizes
            recent_complaints = Complaint.objects.filter(organisation=org).order_by("-created_at")[:50]
            complaints_texts = [
                f"Status: {c.status}, Severity: {c.severity}, Dept: {c.department.name if c.department else 'None'}, Desc: {c.description}" 
                for c in recent_complaints
            ]
            
            if not complaints_texts:
                return Response({"summary": "No recent complaints found to summarize.", "key_issues": []})
                
            ai_data = summarize_organisation_complaints(complaints_texts, org.name)
            return Response(ai_data)

        if action == "update_org_description":
            desc = request.data.get("description", "")
            org.description = desc
            org.save()
            return Response({"message": "Organisation description updated successfully."})

        return Response({"error": "Invalid action"}, status=400)



def handle_create_work(request, department):
    title = request.POST.get("title")
    desc = request.POST.get("desc")

    if not title:
        return

    DepartmentWork.objects.create(
        department=department,
        title=title,
        description=desc or ""
    )


def handle_assign_work(request, department):
    cid = request.POST.get("complaint_id")
    wid = request.POST.get("work_id")

    if not cid or not wid:
        return

    try:
        complaint = Complaint.objects.get(id=cid)
        work = DepartmentWork.objects.get(id=wid, department=department)
    except (Complaint.DoesNotExist, DepartmentWork.DoesNotExist):
        return

    if department in complaint.departments.all():
        complaint.works.add(work)
def organisation_stats_api(request, cin):
    try:
        # 1. Identify the organization using the CIN from your model
        org = Organisation.objects.get(cin=cin)
        
        # 2. Get the count of complaints for this org
        complaints = Complaint.objects.filter(organisation=org)
        
        # 3. Calculate breakdown for the Pie Chart
        # This groups by status and counts them in one database query
        status_counts = complaints.values('status').annotate(total=Count('status'))
        
        # 4. Initialize our response object
        stats_data = {
            "total": complaints.count(),
            "pending": 0,
            "in_progress": 0,
            "resolved": 0,
            "rejected": 0
        }

        # 5. Map DB results to our JSON keys
        for item in status_counts:
            status = item['status'].lower().replace(" ", "_")
            if status in stats_data:
                stats_data[status] = item['total']

        return JsonResponse(stats_data)

    except Organisation.DoesNotExist:
        return JsonResponse({"error": "Organisation not found"}, status=404)
        return Response({"error": "Invalid action"}, status=400)


class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required"}, status=400)
            
        if User.objects.filter(email=email).exists():
            return Response({"error": "User with this email already exists"}, status=400)

        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # Save or update OTP record
        otp_record, created = OTPVerification.objects.update_or_create(
            email=email,
            defaults={'otp': otp, 'created_at': timezone.now()}
        )

        print(f"\n[OTP DEBUG] Sent OTP {otp} to {email}\n")
        
        # Send Email
        try:
            send_email(
                subject="Your ResolvePro Organisation Creation OTP",
                body=f"Your OTP for creating an organisation on ResolvePro is: {otp}. It is valid for 10 minutes.",
                to_email=email
            )
        except Exception as e:
            return Response({"error": "Failed to send email. Please try again later."}, status=500)
            
        return Response({"message": "OTP sent successfully"}, status=200)

class CreateOrganisationView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data

        # OTP Validation
        email = data.get("adminEmail")
        submitted_otp = data.get("otp")

        if not email or not submitted_otp:
            return Response({"error": "Admin email and OTP are required"}, status=400)

        try:
            otp_record = OTPVerification.objects.get(email=email, otp=submitted_otp)
            if not otp_record.is_valid():
                return Response({"error": "OTP has expired. Please request a new one."}, status=400)
        except OTPVerification.DoesNotExist:
            return Response({"error": "Invalid OTP. Please check and try again."}, status=400)

        # Validated — create organisation
        name = data.get("orgName")
        if not name:
            return Response({"error": "Organisation name is required"}, status=400)

        slug = slugify(name)
        base_slug = slug
        counter = 1
        while Organisation.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        org = Organisation.objects.create(
            name=name,
            slug=slug,
            organisation_type=data.get("orgType", "private"),
            official_email=data.get("email", ""),
            phone=data.get("phone", ""),
            website=data.get("website", ""),
            cin=data.get("cin", ""),
            gstin=data.get("gstin", ""),
            city=data.get("city", ""),
            state=data.get("state", ""),
            country=data.get("country", ""),
            description=data.get("description", ""),
        )

        # Handle logo file upload
        logo = request.FILES.get("logo")
        if logo:
            org.logo = logo
            org.save()

        admin_email = data.get("adminEmail")
        temp_password = secrets.token_urlsafe(10)

        user = User.objects.create(
            username=admin_email,
            email=admin_email,
            password=make_password(temp_password),
            first_name=data.get("adminName", "")
        )

        Manager.objects.create(
            user=user,
            organisation=org,
            is_owner=True
        )

        # Clean up OTP record
        otp_record.delete()

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
            
        temp_password = data.get("password")
        if not temp_password:
            return Response({"error": "Password is required"}, status=400)
        
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
            "email": user.email
        }, status=201)

class AIManagerEmployeeAssignView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import Manager, Employee, Complaint
        from .service import ai_assign_employees
        from django.db.models import Count

        manager = get_object_or_404(Manager, user=request.user)
        org = manager.organisation

        # Get pending complaints with no assignments in this org
        unassigned_complaints = Complaint.objects.annotate(
            assignee_count=Count('assigned_employees')
        ).filter(
            organisation=org,
            status='PENDING',
            assignee_count=0
        )

        if not unassigned_complaints.exists():
            return Response({"message": "No unassigned pending complaints found."})

        # Get all employees in the org and their current load
        employees = Employee.objects.filter(organisation=org).annotate(
            current_load=Count('assigned_complaints', filter=~Q(assigned_complaints__status='CLOSED'))
        )
        
        if not employees.exists():
            return Response({"error": "No employees found in the organization."}, status=400)

        employees_data = [
            {"id": str(e.id), "name": f"{e.user.first_name} {e.user.last_name}".strip() or e.user.username, "count": e.current_load}
            for e in employees
        ]

        result = ai_assign_employees(unassigned_complaints, employees_data)
        mapping = result.get("mapping", {})

        assigned_count = 0
        for complaint_uuid_str, emp_uuid_str in mapping.items():
            try:
                complaint = unassigned_complaints.get(id=complaint_uuid_str)
                employee = employees.get(id=emp_uuid_str)
                complaint.assigned_employees.add(employee)
                assigned_count += 1
            except Exception:
                continue

        return Response({
            "message": f"Successfully auto-assigned {assigned_count} complaints.",
            "mapping": mapping
        })
