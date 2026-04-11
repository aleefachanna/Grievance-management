from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

class IsEmployee(permissions.BasePermission):
    message = "Access Denied. You must be logged in as an Employee. Clear your browser cache or logout."
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and hasattr(request.user, 'employee_profile'))
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import Employee, Complaint, DepartmentWork, ComplaintUpdate
from core.serializers import ComplaintDetailSerializer, DepartmentWorkSerializer
from core.service import ai_assign_works, summarize_department_work, ai_assign_employees
from core.views import send_email


class AIAssignView(APIView):
    permission_classes = [IsEmployee]

    def post(self, request):
        employee = get_object_or_404(Employee, user=request.user)

        if not employee.isHod:
            return Response({"error": "Only HOD allowed"}, status=403)

        complaints = Complaint.objects.filter(department=employee.department)[:30]
        works = DepartmentWork.objects.filter(department=employee.department)[:20]

        result = ai_assign_works(complaints, works)

        return Response(result)


class AIEmployeeAssignView(APIView):
    permission_classes = [IsEmployee]

    def post(self, request):
        employee = get_object_or_404(Employee, user=request.user)

        if not employee.isHod:
            return Response({"error": "Only HOD allowed"}, status=403)

        # 1. Get unassigned pending complaints in THIS department
        unassigned_complaints = Complaint.objects.filter(
            department=employee.department,
            assigned_employees__isnull=True,
            status="PENDING"
        )

        if not unassigned_complaints.exists():
            return Response({"message": "No unassigned pending complaints found."})

        # 2. Get all employees in this department and their current 'active' workload
        from django.db.models import Count, Q
        dept_employees = Employee.objects.filter(department=employee.department).annotate(
            active_load=Count(
                'assigned_complaints', 
                filter=Q(assigned_complaints__status__in=['PENDING', 'WORKING'])
            )
        )

        emp_data = [
            {"id": str(e.id), "name": e.user.first_name or e.user.username, "count": e.active_load}
            for e in dept_employees
        ]

        # 3. Call AI service
        ai_result = ai_assign_employees(unassigned_complaints, emp_data)
        mapping = ai_result.get("mapping", {})

        # 4. Apply mapping
        results = []
        for complaint_id_str, employee_id_str in mapping.items():
            try:
                # Need to handle potential UUID vs database ID depending on how AI returns it
                # Usually AI will return what we gave it (str(c.id))
                complaint = Complaint.objects.get(id=complaint_id_str, department=employee.department)
                target_emp = Employee.objects.get(id=employee_id_str, department=employee.department)
                
                complaint.assigned_employees.add(target_emp)
                results.append(f"Complaint {complaint_id_str} assigned to {target_emp.user.username}")
            except Exception as e:
                print(f"Error applying AI assignment for {complaint_id_str}: {e}")

        return Response({
            "message": "AI Auto-Assignment complete.",
            "message": "AI Auto-Assignment complete.",
            "details": results
        })

class AIAutoManageWorksView(APIView):
    permission_classes = [IsEmployee]

    def post(self, request):
        employee = get_object_or_404(Employee, user=request.user)
        if not employee.isHod:
            return Response({"error": "Only HOD allowed"}, status=403)

        from django.db.models import Q
        unassigned_complaints = Complaint.objects.filter(
            department=employee.department,
            works__isnull=True,
            status="PENDING"
        )[:20]

        active_works = DepartmentWork.objects.filter(
            department=employee.department,
            status__in=["PENDING", "IN_PROGRESS"]
        )[:20]

        if not unassigned_complaints.exists():
            return Response({"message": "No unassigned pending complaints found."})

        from core.service import ai_auto_manage_works
        ai_result = ai_auto_manage_works(active_works, unassigned_complaints)
        
        assign_to_existing = ai_result.get("assign_to_existing", [])
        create_new = ai_result.get("create_new", [])

        mapped_count = 0
        new_work_count = 0

        from django.db import transaction
        with transaction.atomic():
            # 1. Map to existing
            for mapping in assign_to_existing:
                wid = mapping.get("work_id")
                cids = mapping.get("complaint_ids", [])
                if not wid or not cids: continue
                
                try:
                    work = DepartmentWork.objects.get(id=wid, department=employee.department)
                    for c in unassigned_complaints:
                        if str(c.id) in cids:
                            c.works.add(work)
                            mapped_count += 1
                except Exception:
                    pass

            # 2. Create new
            for new_work in create_new:
                title = new_work.get("title", "AI Generated Work")
                desc = new_work.get("description", "")
                cids = new_work.get("complaint_ids", [])
                
                if not cids: continue

                filtered_comps = [c for c in unassigned_complaints if str(c.id) in cids]
                if not filtered_comps: continue

                work = DepartmentWork.objects.create(
                    title=title,
                    description=desc,
                    organisation=employee.organisation,
                    department=employee.department
                )

                for c in filtered_comps:
                    c.works.add(work)
                    mapped_count += 1
                new_work_count += 1

        return Response({
            "message": f"Successfully assigned {mapped_count} complaints. Created {new_work_count} new works."
        })


class DepartmentAnalyzeView(APIView):
    permission_classes = [IsEmployee]

    def post(self, request):
        employee = get_object_or_404(Employee, user=request.user)

        if not employee.isHod:
            return Response({"error": "Only HOD allowed"}, status=403)

        complaints = Complaint.objects.filter(department=employee.department)
        texts = list(complaints.values_list("description", flat=True))[:30]

        report = summarize_department_work(texts, employee.department.name)

        return Response({"report": report})

class AIDraftResolutionView(APIView):
    permission_classes = [IsEmployee]

    def post(self, request):
        desc = request.data.get("description", "No description provided.")
        employee = request.user.employee_profile
        from core.service import ai_draft_resolution_email
        draft = ai_draft_resolution_email(desc, employee.department.name)
        return Response({"draft": draft})

class DepartmentWorkViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentWorkSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        employee = get_object_or_404(Employee, user=self.request.user)
        return DepartmentWork.objects.filter(
            department=employee.department
        ).order_by("-created_at")

    def perform_create(self, serializer):
        # Use get_object_or_404 to safely get employee profile
        employee = get_object_or_404(Employee, user=self.request.user)

        if not employee.isHod:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only HOD can create work")

        # Handle organisation boundary internally via self.request
        work = serializer.save(
            department=employee.department, 
            organisation=employee.organisation
        )
        
        # Link Complaint if provided
        complaint_id = self.request.data.get("complaint_id")
        if complaint_id:
            try:
                # Use id=complaint_id for database lookup
                complaint = Complaint.objects.get(id=complaint_id, department=employee.department)
                complaint.works.add(work)
            except (Complaint.DoesNotExist, ValueError):
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
        employee = request.user.employee_profile

        if not employee.isHod:
            return Response({"error": "Only HOD can assign"}, status=403)

        emp_id = request.data.get("employee_id")
        emp = get_object_or_404(
            Employee,
            id=emp_id,
            department=employee.department
        )

        work.employees.add(emp)
        
        # Cascade assignment to all complaints linked to this work
        for comp in work.complaints.all():
            comp.assigned_employees.add(emp)
            
        return Response({"message": "Assigned successfully to Work and linked Complaints"})

    # 🔹 Work Partial Update
    def partial_update(self, request, *args, **kwargs):
        work = self.get_object()
        employee = request.user.employee_profile
        new_status = request.data.get("status")

        if not employee.isHod and employee not in work.employees.all():
            return Response({"error": "Only assigned employees or HOD can update status"}, status=403)

        if new_status:
            work.status = new_status
            work.save()

            if new_status == "IN_PROGRESS":
                for complaint in work.complaints.all():
                    if complaint.status == "PENDING":
                        complaint.status = "WORKING"
                        complaint.save()

                        # Keep timeline informed
                        ComplaintUpdate.objects.create(
                            complaint=complaint,
                            author=employee.user,
                            message=f"System: Work '{work.title}' is now In Progress. This complaint is actively being addressed.",
                            is_public=True
                        )

                        if complaint.user_email:
                            email_body = f"Hello,\n\nThe status of your complaint ({complaint.complaint_id}) has been updated to {complaint.status}.\n\nRegards,\n{employee.organisation.name}"
                            try:
                                send_email("Complaint Status Update", email_body, complaint.user_email)
                            except Exception:
                                pass

        return Response(self.get_serializer(work).data)

    # 🔹 Complete work
    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        work = self.get_object()
        employee = request.user.employee_profile

        if not employee.isHod:
            if employee not in work.employees.all():
                return Response({"error": "Not assigned"}, status=403)

        work.status = "CLOSED"
        work.completed_at = timezone.now()
        work.save()

        # Seamlessly complete all underlying complaints
        for complaint in work.complaints.all():
            if complaint.status != "CLOSED":
                complaint.status = "CLOSED"
                complaint.closed_at = timezone.now()
                complaint.save()

                remarks = request.data.get("remarks", "")
                remarks_text = f"\n\nDepartment Remarks:\n{remarks}" if remarks.strip() else ""

                message = f"System: Work '{work.title}' has been marked Closed. This grievance is fully resolved.{remarks_text}"
                ComplaintUpdate.objects.create(
                    complaint=complaint,
                    author=employee.user,
                    message=message,
                    is_public=True
                )

                if complaint.user_email:
                    email_body = f"""Hello,

This is to inform you that your grievance ({complaint.complaint_id}) mapped to our internal work order '{work.title}' has been successfully marked as CLOSED by the department.{remarks_text}

Thank you for your patience.

Regards,
{employee.organisation.name}"""
                    try:
                        send_email(f"Complaint Resolved – {complaint.complaint_id}", email_body, complaint.user_email)
                    except Exception as e:
                        print("Email send failed:", e)

        return Response({"message": "Work completed and all linked complaints fully resolved!"})

class DepartmentComplaintViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintDetailSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        employee = get_object_or_404(Employee, user=self.request.user)
        from django.db.models import Q
        return Complaint.objects.filter(
            Q(department=employee.department) | Q(assigned_employees=employee)
        ).distinct().order_by("-created_at")

    def partial_update(self, request, *args, **kwargs):
        complaint = self.get_object()
        employee = request.user.employee_profile
        new_status = request.data.get("status")
        old_status = complaint.status

        if new_status == "CLOSED":
            complaint.status = "CLOSED"
            complaint.closed_at = timezone.now()
        else:
            complaint.status = new_status

        complaint.save()

        # Create public trail
        if old_status != complaint.status:
            remarks = request.data.get("remarks", "")
            remarks_text = f"\n\nDepartment Remarks:\n{remarks}" if remarks.strip() else ""

            message = f"System: Complaint status updated from {old_status} to {complaint.status}{remarks_text}"
            ComplaintUpdate.objects.create(
                complaint=complaint,
                author=employee.user,
                message=message,
                is_public=True
            )
            
            # Trigger email logic
            if complaint.status == "WORKING" and complaint.user_email:
                email_body = f"Hello,\n\nYour complaint ({complaint.complaint_id}) is now actively being resolved by our staff. (Status: Working)\n\nRegards,\n{employee.organisation.name}"
                try:
                    send_email(f"Complaint Update – {complaint.complaint_id}", email_body, complaint.user_email)
                except Exception:
                    pass

            elif complaint.status == "CLOSED" and complaint.user_email:
                email_body = f"""Hello,

This is to inform you that your grievance ({complaint.complaint_id}) has been successfully marked as CLOSED by the department.{remarks_text}

Thank you for bringing this to our attention.

Regards,
{employee.organisation.name}"""
                try:
                    send_email(f"Complaint Resolved – {complaint.complaint_id}", email_body, complaint.user_email)
                except Exception:
                    pass

        return Response(self.get_serializer(complaint).data)

    @action(detail=True, methods=["post"])
    def add_update(self, request, pk=None):
        complaint = self.get_object()
        employee = request.user.employee_profile
        
        message = request.data.get("message")
        is_public = request.data.get("is_public", False)
        
        if not message:
            return Response({"error": "Message is required"}, status=400)
            
        ComplaintUpdate.objects.create(
            complaint=complaint,
            author=employee.user,
            message=message,
            is_public=is_public
        )
        return Response({"message": "Update added successfully"})

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        complaint = self.get_object()
        employee = request.user.employee_profile

        if not employee.isHod:
            return Response({"error": "Only HOD can assign directly"}, status=403)

        emp_ids = request.data.get("employee_ids", [])
        if not isinstance(emp_ids, list):
            emp_ids = [emp_ids]
            
        if not emp_ids:
            return Response({"error": "No employees provided"}, status=400)

        emps = Employee.objects.filter(id__in=emp_ids, department=employee.department)
        complaint.assigned_employees.set(emps)
        return Response({"message": "Employees assigned successfully to complaint"})

    @action(detail=True, methods=["post"])
    def assign_work(self, request, pk=None):
        complaint = self.get_object()
        employee = request.user.employee_profile

        if not employee.isHod:
            return Response({"error": "Only HOD can assign work directly"}, status=403)

        work_id = request.data.get("work_id")
        if not work_id:
            return Response({"error": "Work ID required"}, status=400)
            
        work = get_object_or_404(DepartmentWork, id=work_id, department=employee.department)
        complaint.works.add(work)
        
        return Response({"message": "Work linked successfully to complaint."})
class DepartmentDashboardView(APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        employee = get_object_or_404(Employee, user=request.user)
        department = employee.department

        from django.db.models import Q
        complaints = Complaint.objects.filter(
            Q(department=department) | Q(assigned_employees=employee)
        ).distinct()
        works = DepartmentWork.objects.filter(
            Q(department=department) | Q(employees=employee)
        ).distinct()
        employees = Employee.objects.filter(department=department).select_related("user")

        return Response({
            "department": department.name,
            "is_hod": employee.isHod,
            "current_employee_id": str(employee.id),
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
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response({"error": "Both old and new passwords are required."}, status=400)

        if not user.check_password(old_password):
            return Response({"error": "Incorrect old password."}, status=400)

        user.set_password(new_password)
        user.save()
        
        return Response({"message": "Password changed successfully."})

class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):

        empid = request.data.get("empid")
        password = request.data.get("password")

        if not empid or not password:
            return Response(
                {"error": "Employee ID and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            employee = Employee.objects.select_related(
                "user", "organisation"
            ).get(employee_id__iexact=empid)

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