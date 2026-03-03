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
            raise PermissionDenied("Only HOD can create work")

        serializer.save(department=employee.department)

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
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        organisation_id = request.data.get("organisation_id")
        password = request.data.get("password")
        new_password = request.data.get("new_password")

        if not email or not organisation_id or not password:
            return Response(
                {"error": "Email, organisation and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            employee = Employee.objects.select_related(
                "user", "organisation"
            ).get(
                user__email=email,
                organisation__id=organisation_id
            )

            if not employee.user.check_password(password):
                raise Employee.DoesNotExist

            # FIRST LOGIN LOGIC
            if employee.is_first_login:

                if not new_password:
                    return Response({
                        "message": "First login. Password change required.",
                        "first_login": True
                    })

                employee.user.set_password(new_password)
                employee.user.save()
                employee.is_first_login = False
                employee.save()

            # 🔥 CREATE JWT TOKENS
            refresh = RefreshToken.for_user(employee.user)

            return Response({
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "employee_name": employee.user.get_full_name() or employee.user.username,
                "organisation_id": str(employee.organisation.id),
                "first_login": employee.is_first_login
            })

        except Employee.DoesNotExist:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )