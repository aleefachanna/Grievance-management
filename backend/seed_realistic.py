import uuid
import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from django.db import transaction
from core.models import Organisation, Department, Employee, Manager, DepartmentWork, Complaint, ComplaintUpdate

@transaction.atomic
def seed():
    print("Seeding realistic database...")

    # 1. Org
    org, created = Organisation.objects.get_or_create(
        slug="tech-corp",
        defaults={
            "name": "Tech Corp",
            "organisation_type": "private",
            "official_email": "admin@techcorp.com",
            "city": "New York",
            "state": "NY",
            "country": "USA",
        }
    )

    # 2. Departments
    dept_names = ["HR", "IT", "Finance", "Operations", "Facilities"]
    departments = {}
    for name in dept_names:
        d, _ = Department.objects.get_or_create(organisation=org, name=name)
        departments[name] = d

    # 3. Manager
    manager_user, _ = User.objects.get_or_create(username="real_manager", defaults={"email": "real_manager@techcorp.com", "first_name": "John", "last_name": "Doe"})
    manager_user.set_password("Manager@123")
    manager_user.save()
    Manager.objects.get_or_create(user=manager_user, organisation=org, defaults={"is_owner": True})

    # 4. Employees
    emps = []
    # Mix of HODs and regulars
    for i, name in enumerate(["Alice", "Bob", "Charlie", "Diana", "Eve"]):
        emp_user, _ = User.objects.get_or_create(username=f"real_emp{i+1}", defaults={"email": f"real_emp{i+1}@techcorp.com", "first_name": name, "last_name": "Smith"})
        emp_user.set_password("Emp@123")
        emp_user.save()
        is_hod = (i % 2 == 0) # Some are HODs
        dept_name = dept_names[i % len(dept_names)]
        emp, _ = Employee.objects.get_or_create(
            user=emp_user,
            organisation=org,
            defaults={
                "department": departments[dept_name],
                "employee_id": f"REMP90{i+1}",
                "is_first_login": False,
                "isHod": is_hod
            }
        )
        emps.append(emp)

    # 5. Complaints
    complaints_data = [
        ("Facilities", "My chair is broken, need a replacement.", "2", "PENDING", "customer1@gmail.com"),
        ("IT", "Cannot access VPN since morning.", "4", "WORKING", "customer2@gmail.com"),
        ("Finance", "Payroll discrepancy for last month.", "5", "WORKING", "customer3@gmail.com"),
        ("Facilities", "Aircon is leaking in meeting room B.", "3", "CLOSED", "customer4@gmail.com"),
        ("IT", "Need software license for Photoshop.", "2", "PENDING", "customer5@gmail.com"),
        ("HR", "Requesting information on maternity leave policies.", "2", "CLOSED", "customer1@gmail.com"),
        ("Facilities", "Coffee machine needs repair on 3rd floor.", "1", "REQUESTED_CLOSE", "customer2@gmail.com"),
        ("Finance", "Expense report rejected without reason.", "3", "CLOSED", "customer3@gmail.com"),
        ("Operations", "Vendor payment delayed by 2 weeks.", "4", "WORKING", "customer4@gmail.com"),
        ("IT", "Laptop battery drains very fast.", "2", "PENDING", "customer5@gmail.com"),
        ("HR", "Conflict with team member.", "5", "WORKING", "customer1@gmail.com"),
        ("Operations", "Need new delivery guidelines document.", "2", "PENDING", "customer2@gmail.com")
    ]

    for dept, desc, severity, status, email in complaints_data:
        deadline_days = {"0": 30, "1": 14, "2": 7, "3": 3, "4": 1, "5": 1}.get(severity, 30)
        
        # for overdue demo, let's make some deadlines in the past
        is_overdue = random.choice([True, False]) if status != "CLOSED" else False
        
        if is_overdue:
            deadline = timezone.now() - timedelta(days=random.randint(1, 4))
        else:
            deadline = timezone.now() + timedelta(days=deadline_days)
        
        c = Complaint.objects.create(
            user_email=email,
            organisation=org,
            department=departments[dept],
            description=desc,
            severity=severity,
            status=status,
            deadline=deadline
        )
        if status == "CLOSED":
            c.closed_at = timezone.now() - timedelta(days=random.randint(1, 5))
            c.save()

        # Add updates to some
        if status in ["WORKING", "REQUESTED_CLOSE", "CLOSED"] or random.choice([True, False]):
            dept_emps = [e for e in emps if e.department == c.department]
            author = random.choice(dept_emps).user if dept_emps else manager_user
            
            ComplaintUpdate.objects.create(
                complaint=c,
                author=author,
                message=f"Received and reviewed report.",
                is_public=True
            )
            
            if status != "PENDING":
                ComplaintUpdate.objects.create(
                    complaint=c,
                    author=author,
                    message=f"Status changed to {status}. Looking into it.",
                    is_public=True
                )
            
            if status == "CLOSED":
                ComplaintUpdate.objects.create(
                    complaint=c,
                    author=author,
                    message="Issue has been resolved and closed.",
                    is_public=True
                )
            
            # Create work record
            if status != "CLOSED":
                w = DepartmentWork.objects.create(
                    organisation=org,
                    department=departments[dept],
                    title=f"Resolve: {desc[:20]}...",
                    description=desc,
                    status="IN_PROGRESS"
                )
                if dept_emps:
                    w.employees.add(random.choice(dept_emps))
                c.works.add(w)

    print("Realistic seeding completed successfully ✅")

seed()
