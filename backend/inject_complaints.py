import os
import django
import random
from datetime import timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Organisation, Department, Complaint, Employee

def inject():
    print("Starting dummy data injection for 'tech-corp'...")
    
    try:
        org = Organisation.objects.get(slug='tech-corp')
    except Organisation.DoesNotExist:
        print("Organization 'tech-corp' not found. Please create it first.")
        return

    # Ensure departments exist
    hr, _ = Department.objects.get_or_create(organisation=org, name="HR")
    it, _ = Department.objects.get_or_create(organisation=org, name="IT")
    
    depts = {"HR": hr, "IT": it}
    employees = list(Employee.objects.filter(organisation=org))

    complaints_to_create = [
        ("IT", "Constant flickering on monitor screen in the design studio.", "2", "PENDING", "designer1@gmail.com"),
        ("HR", "Delay in processing travel reimbursement for the Singapore conference.", "3", "WORKING", "sales_lead@techcorp.com"),
        ("IT", "Unable to login to the internal payroll portal since morning.", "4", "PENDING", "finance_guy@gmail.com"),
        ("IT", "Requesting installation of Adobe Creative Suite for the new interns.", "2", "WORKING", "intern_mgr@gmail.com"),
        ("HR", "Clarification needed on the newly updated hybrid work/dress code policy.", "1", "CLOSED", "senior_dev@gmail.com"),
        ("HR", "Discrepancy in monthly performance bonus calculation for Q3.", "4", "PENDING", "accountant@gmail.com"),
        ("IT", "Wifi dead zones identified in the cafeteria and meeting room C.", "3", "WORKING", "ops_team@gmail.com"),
        ("IT", "Critical: Blue screen of death on my primary workstation after update.", "5", "PENDING", "admin_asst@gmail.com"),
        ("HR", "Workspace noise level on the 4th floor is too high for focused work.", "2", "WORKING", "content_writer@gmail.com"),
        ("IT", "Forgot password for the company HRMS system again.", "1", "CLOSED", "new_joiner@gmail.com"),
        ("HR", "Query regarding the available slots for the annual health checkup.", "2", "PENDING", "manager_ops@gmail.com"),
        ("IT", "Wireless mouse not working even after replacing batteries.", "1", "WORKING", "intern2@gmail.com"),
    ]

    count = 0
    for dept_name, desc, severity, status, email in complaints_to_create:
        # Randomize deadline for realism
        deadline_days = {"0": 30, "1": 14, "2": 7, "3": 3, "4": 1, "5": 1}.get(severity, 30)
        deadline = timezone.now() + timedelta(days=random.randint(-2, deadline_days))
        
        complaint = Complaint.objects.create(
            user_email=email,
            organisation=org,
            department=depts[dept_name],
            description=desc,
            severity=severity,
            status=status,
            deadline=deadline,
            created_at=timezone.now() - timedelta(days=random.randint(0, 5))
        )
        
        # Randomly assign an employee if available and status is not PENDING
        if status != "PENDING" and employees:
            num_assignees = random.randint(1, min(2, len(employees)))
            assignees = random.sample(employees, num_assignees)
            complaint.assigned_employees.set(assignees)
            
        if status == "CLOSED":
            complaint.closed_at = timezone.now() - timedelta(hours=random.randint(1, 24))
            complaint.save()
            
        count += 1

    print(f"Successfully injected {count} complaints into 'tech-corp'!")

if __name__ == "__main__":
    inject()
