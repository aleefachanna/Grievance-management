from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from django.contrib.auth import authenticate
from django.core.mail import EmailMessage
from django.conf import settings
# ... keep your other imports like APIView, Response, etc.
from .models import Complaint, Department, DepartmentWork, Employee
from organisation.models import Organisation
from .serializers import ComplaintSerializer, DepartmentWorkSerializer, OrganisationSerializer
from .service import classify_and_summarize, summarize_department_work, ai_assign_works

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
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
            department = employee.department
            
            complaints = Complaint.objects.filter(departments=department).order_by("-created_at")
            works = DepartmentWork.objects.filter(department=department).order_by("-created_at")
            
            return Response({
                "complaints": ComplaintSerializer(complaints, many=True).data,
                "works": DepartmentWorkSerializer(works, many=True).data,
                "department_name": department.name
            })
        except Employee.DoesNotExist:
            return Response({"error": "Employee profile not found"}, status=404)

    def post(self, request):
        employee = Employee.objects.get(user=request.user)
        department = employee.department
        action = request.data.get("action")
        
        # 1. AI Assign Logic
        if action == "ai_assign":
            complaints = Complaint.objects.filter(departments=department)[:30]
            works = DepartmentWork.objects.filter(department=department)[:20]
            result = ai_assign_works(list(complaints), list(works))
            for cid, titles in result.get("mapping", {}).items():
                c = Complaint.objects.get(id=cid)
                w_objs = DepartmentWork.objects.filter(title__in=titles, department=department)
                c.works.add(*w_objs)
            return Response({"message": "AI Assignment Complete"})

        # 2. Complete Work Logic
        elif action == "complete_work":
            wid = request.data.get("work_id")
            work = DepartmentWork.objects.get(id=wid, department=department)
            work.status = "DONE"
            work.completed_at = timezone.now()
            work.save()
            return Response({"message": "Work marked as done"})

        # 3. Analyze (AI Report)
        elif action == "analyze":
            complaints = Complaint.objects.filter(departments=department)[:30]
            texts = list(complaints.values_list("description", flat=True))
            ai_report = summarize_department_work(texts, department.name)
            return Response({"ai_report": ai_report})

        # 4. Status Update
        elif action == "new_status":
            cid = request.data.get("complaint_id")
            new_status = request.data.get("new_status")
            complaint = Complaint.objects.get(id=cid)
            if department in complaint.departments.all():
                complaint.status = new_status
                complaint.closed_at = timezone.now() if new_status == "CLOSED" else None
                complaint.save()
            return Response({"message": f"Status updated to {new_status}"})

        # 5. Create Work
        elif action == "create_work":
            DepartmentWork.objects.create(
                department=department,
                title=request.data.get("title"),
                description=request.data.get("desc", "")
            )
            return Response({"message": "Work created successfully"})

        return Response({"error": "Invalid Action"}, status=400)