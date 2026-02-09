
import uuid
from django.core.mail import EmailMessage
from django.conf import settings
from django.http import JsonResponse
# Use relative imports (the dot means 'this current app folder')
from datetime import timezone

from django.http import request
from .models import DepartmentWork, Department, Complaint, Employee
from django.contrib.auth import login
from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.utils import timezone
# Ensure your file is named service.py or utils.py and match it here
from .service import classify_and_summarize, summarize_department_work, ai_assign_works
from .models import Employee  # Assuming your model is named Employee
from organisation.models import Organisation
def dep_login(request):
    if request.method == 'POST':
        dep_id = request.POST.get('Dep_id')
        emp_id = request.POST.get('Emp_id')

        try:
            # Look for the employee matching both credentials
            employee = Employee.objects.get(department__dept_id=dep_id, employeeid=emp_id)
            
            # Link the Employee's user account to the session
            # Note: This assumes your Employee model has a OneToOne relationship with User
            user = employee.user 
            login(request, user)
            
            messages.success(request, f"Welcome back, {employee.name}!")
            return redirect('dashboard')  # Replace with your target URL name

        except Employee.DoesNotExist:
            messages.error(request, "Invalid Department ID or Employee ID.")
            return render(request, 'login.html')

    return render(request, 'login.html')

def submit_complaint(request):
    if request.method == "POST":
        org_id = request.POST.get('organisation')
        description = request.POST.get('description')
        email = request.POST.get('email')

        organisation = Organisation.objects.get(id=org_id)
        dept_queryset = Department.objects.filter(organisation=organisation)
        dept_names = list(dept_queryset.values_list('name', flat=True))

        # ✅ Always create complaint first
        complaint = Complaint.objects.create(
            user_email=email,
            organisation=organisation,
            description=description,
        )

        try:
            # ✅ Call AI
            ai_result = classify_and_summarize(description, dept_names)

            departments = ai_result.get("departments", [])
            summary = ai_result.get("summary", "")
            severity = ai_result.get("severity", "0")

            # ✅ Validate severity
            if severity not in ["0", "1", "2", "3", "4", "5"]:
                severity = "0"

            complaint.ai_summary = summary
            complaint.severity = severity
            complaint.save()

            # ✅ Set many-to-many safely
            if departments:
                dept_objects = Department.objects.filter(name__in=departments)
                complaint.departments.set(dept_objects)
            else:
                complaint.departments.clear()

            messages.success(request, "Complaint submitted and analyzed successfully!")

        except Exception as e:
            # ✅ Complaint still exists even if AI fails
            complaint.ai_summary = ""
            complaint.severity = "0"
            complaint.save()

            messages.warning(
                request,
                f"Complaint submitted, but AI analysis failed: {e}"
            )

        # ✅ Send confirmation email
        email_body = f"""
Hello,

Your complaint has been registered successfully.

Complaint ID: {complaint.complaint_id}

Organisation: {organisation.name}
Severity Level: {complaint.severity}

We will review your complaint shortly.

Thank you.
"""

        mail = EmailMessage(
            subject="Complaint Registered Successfully",
            body=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )

        mail.send(fail_silently=True)

        return redirect('submit_complaint')

    organisations = Organisation.objects.all()
    return render(request, 'submit_form.html', {'organisations': organisations})
@login_required
def dep_dashboard(request):
    try:
        employee = Employee.objects.get(user=request.user)
        department = employee.department
    except Employee.DoesNotExist:
        messages.error(request, "You are not assigned to a department.")
        return redirect('/Home/dlogin') # Or wherever appropriate

    # Fetch initial data
    complaints = Complaint.objects.filter(departments=department).order_by("-created_at")
    works = DepartmentWork.objects.filter(department=department).order_by("-created_at")
    ai_report = None

    if request.method == "POST":
        action = request.POST.get("action")

        if action == "ai_assign":
            handle_ai_assign(department, complaints, works)
        elif action == "complete_work":
            handle_complete_work(request, department)
        elif action == "analyze":
            ai_report = handle_analyze(department, complaints)
        elif action == "new_status":
            handle_status_update(request, department)
        elif action == "create_work":
            handle_create_work(request, department)
        elif action == "assign_work":
            handle_assign_work(request, department)
        
        # If the action wasn't 'analyze' (which needs to stay on page to show report), 
        # redirect to refresh and prevent double-POST.
        if action != "analyze":
            return redirect('/Home/depdashboard/')

    context = {
        "complaints": complaints,
        "department": department,
        "works": works,
        "ai_report": ai_report,
    }
    return render(request, "dep_dashboard.html", context)

def handle_ai_assign(department, complaints, works):
    complaints_list = complaints[:30]
    works_list = works[:20]

    if not complaints_list or not works_list:
        return

    result = ai_assign_works(complaints_list, works_list)

    for cid, titles in result.get("mapping", {}).items():
        try:
            c = Complaint.objects.get(id=cid)

            w_objs = DepartmentWork.objects.filter(
                title__in=titles,
                department=department
            )

            c.works.add(*w_objs)
        except Complaint.DoesNotExist:
            pass


def handle_complete_work(request, department):
    wid = request.POST.get("work_id")
    if not wid:
        return

    try:
        work = DepartmentWork.objects.get(id=wid, department=department)
    except DepartmentWork.DoesNotExist:
        return

    work.status = "DONE"
    work.completed_at = timezone.now()
    work.save()

    for c in work.complaint_set.all():
        c.status = "CLOSED"
        c.closed_at = timezone.now()
        c.save()


def handle_analyze(department, complaints):
    texts = list(complaints.values_list("description", flat=True))[:30]
    return summarize_department_work(texts, department.name)


def handle_status_update(request, department):
    cid = request.POST.get("complaint_id")
    new_status = request.POST.get("new_status")

    if not cid or not new_status:
        return

    try:
        complaint = Complaint.objects.get(id=cid)
    except Complaint.DoesNotExist:
        return

    if department not in complaint.departments.all():
        return

    complaint.status = new_status

    if new_status == "CLOSED":
        complaint.closed_at = timezone.now()
    else:
        complaint.closed_at = None

    complaint.save()


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
