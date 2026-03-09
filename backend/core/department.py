from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import Employee, Complaint, DepartmentWork
from core.serializers import ComplaintDetailSerializer, DepartmentWorkSerializer
from core.service import ai_assign_works, summarize_department_work


class AIAssignView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        employee = get_object_or_404(Employee, user=request.user)

        if not employee.isHod:
            return Response({"error": "Only HOD allowed"}, status=403)

        complaints = Complaint.objects.filter(department=employee.department)[:30]
        works = DepartmentWork.objects.filter(department=employee.department)[:20]

        result = ai_assign_works(complaints, works)

        return Response(result)


class DepartmentAnalyzeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        employee = get_object_or_404(Employee, user=request.user)

        if not employee.isHod:
            return Response({"error": "Only HOD allowed"}, status=403)

        complaints = Complaint.objects.filter(department=employee.department)
        texts = list(complaints.values_list("description", flat=True))[:30]

        report = summarize_department_work(texts, employee.department.name)

        return Response({"report": report})

class DepartmentWorkViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentWorkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        employee = get_object_or_404(Employee, user=self.request.user)
        return DepartmentWork.objects.filter(
            department=employee.department
        ).order_by("-created_at")

    def perform_create(self, serializer):
        employee = self.request.user.employee

        if not employee.isHod:
            return Response({"error": "Only HOD can create work"}, status=403)

        # Handle organisation boundary internally via self.request
        work = serializer.save(
            department=employee.department, 
            organisation=employee.organisation
        )
        
        # Link Complaint if provided
        complaint_id = self.request.data.get("complaint_id")
        if complaint_id:
            try:
                complaint = Complaint.objects.get(id=complaint_id, department=employee.department)
                complaint.works.add(work)
            except Complaint.DoesNotExist:
                pass

        # Assign employees if provided
        assigned_employee_ids = self.request.data.get("assigned_employees", [])
        if assigned_employee_ids:
            emps = Employee.objects.filter(id__in=assigned_employee_ids, department=employee.department)
            work.employees.set(emps)

    # 🔹 Assign employee to work
    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        work = self.get_object()
        employee = request.user.employee

        if not employee.isHod:
            return Response({"error": "Only HOD can assign"}, status=403)

        emp_id = request.data.get("employee_id")
        emp = get_object_or_404(
            Employee,
            id=emp_id,
            department=employee.department
        )

        work.employees.add(emp)
        return Response({"message": "Assigned successfully"})

    # 🔹 Complete work
    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        work = self.get_object()
        employee = request.user.employee

        if not employee.isHod:
            if employee not in work.employees.all():
                return Response({"error": "Not assigned"}, status=403)

        work.status = "DONE"
        work.completed_at = timezone.now()
        work.save()

        return Response({"message": "Work completed"})

class DepartmentComplaintViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        employee = get_object_or_404(Employee, user=self.request.user)
        return Complaint.objects.filter(
            department=employee.department
        ).order_by("-created_at")

    def partial_update(self, request, *args, **kwargs):
        complaint = self.get_object()
        employee = request.user.employee
        new_status = request.data.get("status")

        if new_status == "CLOSED":
            if employee.isHod:
                complaint.status = "CLOSED"
                complaint.closed_at = timezone.now()
            else:
                complaint.status = "REQUESTED_CLOSE"
        else:
            if not employee.isHod:
                return Response(
                    {"error": "Only HOD can update status"},
                    status=403
                )
            complaint.status = new_status

        complaint.save()
        return Response(self.get_serializer(complaint).data)
class DepartmentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = get_object_or_404(Employee, user=request.user)
        department = employee.department

        complaints = Complaint.objects.filter(department=department)
        works = DepartmentWork.objects.filter(department=department)
        employees = Employee.objects.filter(department=department).select_related("user")

        return Response({
            "department": department.name,
            "is_hod": employee.isHod,
            "complaints_count": complaints.count(),
            "works_count": works.count(),
            "employees": [
                {
                    "id": e.id,
                    "name": f"{e.user.first_name} {e.user.last_name}".strip()
                            or e.user.username
                }
                for e in employees
            ]
        })
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):

        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"error": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            employee = Employee.objects.select_related(
                "user", "organisation"
            ).get(user__email__iexact=email)

            if not employee.user.check_password(password):
                print("PASSWORD WRONG")
                return Response({"error": "Wrong password"}, status=401)

            print("PASSWORD CORRECT")
            
            # --- GENERATE JWT TOKENS HERE ---
            user = employee.user
            refresh = RefreshToken.for_user(user)
            
            print("------ LOGIN SUCCESS ------\n")

            return Response({
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }, status=200)

        except Employee.DoesNotExist:
            print("EMPLOYEE NOT FOUND")
            return Response({"error": "Employee not found"}, status=401)

        except Exception as e:
            print("ERROR:", str(e))
            return Response({"error": "Server error"}, status=500)