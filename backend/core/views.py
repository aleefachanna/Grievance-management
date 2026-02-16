from urllib import request
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from django.contrib.auth import authenticate
from django.core.mail import EmailMessage
from django.conf import settings
# ... keep your other imports like APIView, Response, etc.
from .models import Complaint, Department, DepartmentWork, Employee,Manager
from organisation.models import Organisation
from .serializers import ComplaintSerializer, DepartmentWorkSerializer, OrganisationSerializer
from .service import classify_and_summarize, summarize_department_work, ai_assign_works
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import ComplaintTrackSerializer
from django.contrib.auth.hashers import check_password
from rest_framework.decorators import api_view

@api_view(['POST'])
def manager_login(request):
    manager_id = request.data.get("manager_id")

    try:
        manager = Manager.objects.get( manager_id=manager_id)
        return Response({
            "message": "Login successful",  
            "manager_id": manager.manager_id,
            "org_id": manager.organisation.id   
        })
    except Manager.DoesNotExist:
        return Response({"error": "Invalid credentials"}, status=400)

@api_view(['GET'])
def track_complaint(request, complaint_id):
    try:
        complaint = Complaint.objects.get(complaint_id=complaint_id)
        serializer = ComplaintTrackSerializer(complaint)
        return Response(serializer.data)
    except Complaint.DoesNotExist:
        return Response(
            {"error": "Complaint not found"},
            status=status.HTTP_404_NOT_FOUND
        )
# 1. CUSTOM LOGIN (Returns JWT)
class LoginView(APIView):
    def post(self, request):
        dep_id = request.data.get('Dep_id')
        emp_id = request.data.get('Emp_id')
        
        try:
            employee = Employee.objects.get(department__dept_id=dep_id, employeeid=emp_id)
            user = employee.user
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'employee_name': employee.name
            })
        except Employee.DoesNotExist:
            return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# 2. SUBMIT COMPLAINT (Public API)
class SubmitComplaintView(APIView):
    # This replaces the "organisations = Organisation.objects.all()" part
    def get(self, request):
        organisations = Organisation.objects.all()
        serializer = OrganisationSerializer(organisations, many=True)
        return Response(serializer.data)

    def post(self, request):
        # React sends data as JSON, accessible via request.data
        org_id = request.data.get('organisation')
        description = request.data.get('description')
        email = request.data.get('email')

        try:
            organisation = Organisation.objects.get(id=org_id)
        except Organisation.DoesNotExist:
            return Response({"error": "Organisation not found"}, status=status.HTTP_404_NOT_FOUND)

        dept_queryset = Department.objects.filter(organisation=organisation)
        dept_names = list(dept_queryset.values_list('name', flat=True))

        # ✅ Create complaint
        complaint = Complaint.objects.create(
            user_email=email,
            organisation=organisation,
            description=description,
        )

        ai_status = "success"
        try:
            # ✅ AI Processing
            ai_result = classify_and_summarize(description, dept_names)
            departments = ai_result.get("departments", [])
            summary = ai_result.get("summary", "")
            severity = str(ai_result.get("severity", "0"))

            if severity not in ["0", "1", "2", "3", "4", "5"]:
                severity = "0"

            complaint.ai_summary = summary
            complaint.severity = severity
            complaint.save()

            if departments:
                dept_objects = Department.objects.filter(name__in=departments)
                complaint.departments.set(dept_objects)

        except Exception as e:
            ai_status = f"failed: {str(e)}"
            complaint.ai_summary = ""
            complaint.severity = "0"
            complaint.save()

        # ✅ Email Logic
        self.send_confirmation_email(complaint, organisation, email)

        return Response({
            "message": "Complaint submitted successfully",
            "ai_status": ai_status,
            "complaint_id": complaint.complaint_id
        }, status=status.HTTP_201_CREATED)

    def send_confirmation_email(self, complaint, organisation, email):
        email_body = f"""
Hello,
Your complaint has been registered successfully.
Complaint ID: {complaint.complaint_id}
Organisation: {organisation.name}
Severity Level: {complaint.severity}
We will review your complaint shortly.
"""
        mail = EmailMessage(
            subject="Complaint Registered Successfully",
            body=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        mail.send(fail_silently=False)

# 3. DASHBOARD (Protected API)
class DepartmentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = Employee.objects.get(user=request.user)
        department = employee.department

        complaints = Complaint.objects.filter(
            departments=department
        ).order_by("-created_at")

        works = DepartmentWork.objects.filter(
            department=department
        ).order_by("-created_at")

        return Response({
            "department_name": department.name,
            "complaints": ComplaintSerializer(complaints, many=True).data,
            "works": DepartmentWorkSerializer(works, many=True).data,
            "employees": [
                {
                    "id": e.id,
                    "name": e.name
                }
                for e in Employee.objects.filter(department=department)
            ]
        })

    def post(self, request):
        employee = Employee.objects.get(user=request.user)
        department = employee.department
        action = request.data.get("action")

        # 1️⃣ Update Complaint Status
        if action == "update_complaint_status":
            complaint = Complaint.objects.get(id=request.data.get("complaint_id"))
            complaint.status = request.data.get("status")
            if complaint.status == "CLOSED":
                complaint.closed_at = timezone.now()
            complaint.save()
            return Response({"message": "Complaint updated"})

        # 2️⃣ Complete Work
        if action == "complete_work":
            work = DepartmentWork.objects.get(
                id=request.data.get("work_id"),
                department=department
            )
            work.status = "DONE"
            work.completed_at = timezone.now()
            work.save()
            return Response({"message": "Work completed"})

        # 3️⃣ Assign Employee to Work
        if action == "assign_employee":
            work = DepartmentWork.objects.get(id=request.data.get("work_id"))
            emp = Employee.objects.get(id=request.data.get("employee_id"))
            work.employees.add(emp)
            return Response({"message": "Employee assigned"})

        # 4️⃣ Create Work
        if action == "create_work":
            DepartmentWork.objects.create(
                department=department,
                title=request.data.get("title"),
                description=request.data.get("description", "")
            )
            return Response({"message": "Work created"})

        return Response({"error": "Invalid action"}, status=400)
class ManagerDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        manager = Manager.objects.get(user=request.user)
        org = manager.organisation

        departments = Department.objects.filter(organisation=org)
        complaints = Complaint.objects.filter(organisation=org)
        works = DepartmentWork.objects.filter(
            department__organisation=org
        )

        return Response({
            "organisation": org.name,
            "departments": [
                {"id": d.id, "name": d.name}
                for d in departments
            ],
            "complaints": ComplaintSerializer(complaints, many=True).data,
            "works": DepartmentWorkSerializer(works, many=True).data,
        })

    def post(self, request):
        manager = Manager.objects.get(user=request.user)
        action = request.data.get("action")

        # Reassign Complaint
        if action == "reassign_complaint":
            complaint = Complaint.objects.get(id=request.data.get("complaint_id"))
            department = Department.objects.get(id=request.data.get("department_id"))

            complaint.departments.set([department])
            complaint.save()

            return Response({"message": "Complaint reassigned"})

        return Response({"error": "Invalid action"}, status=400)