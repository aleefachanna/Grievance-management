import uuid
from django.contrib.auth.models import User
from django.db import transaction
from core.models import (
    Organisation,
    Department,
    Employee,
    Manager,
    DepartmentWork,
    Complaint
)

from django.utils.text import slugify


@transaction.atomic
def seed():

    print("Seeding database...")

    # =============================
    # 1️⃣ ORGANISATION
    # =============================

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

    print("Organisation:", org.name)

    # =============================
    # 2️⃣ DEPARTMENTS
    # =============================

    hr, _ = Department.objects.get_or_create(
        organisation=org,
        name="HR"
    )

    it, _ = Department.objects.get_or_create(
        organisation=org,
        name="IT"
    )

    print("Departments created")

    # =============================
    # 3️⃣ MANAGER (OWNER)
    # =============================

    manager_user, _ = User.objects.get_or_create(
        username="manager1",
        defaults={
            "email": "manager@techcorp.com",
            "first_name": "John",
            "last_name": "Doe",
        }
    )

    manager_user.set_password("Manager@123")
    manager_user.save()

    manager, _ = Manager.objects.get_or_create(
        user=manager_user,
        organisation=org,
        defaults={"is_owner": True}
    )

    print("Manager created")

    # =============================
    # 4️⃣ EMPLOYEES
    # =============================

    emp1_user, _ = User.objects.get_or_create(
        username="emp1",
        defaults={
            "email": "emp1@techcorp.com",
            "first_name": "Alice",
            "last_name": "Smith",
        }
    )
    emp1_user.set_password("Emp@123")
    emp1_user.save()

    emp1, _ = Employee.objects.get_or_create(
        user=emp1_user,
        organisation=org,
        defaults={
            "department": hr,
            "employee_id": "EMP001",
            "is_first_login": False,
        }
    )

    emp2_user, _ = User.objects.get_or_create(
        username="emp2",
        defaults={
            "email": "emp2@techcorp.com",
            "first_name": "Bob",
            "last_name": "Johnson",
        }
    )
    emp2_user.set_password("Emp@123")
    emp2_user.save()

    emp2, _ = Employee.objects.get_or_create(
        user=emp2_user,
        organisation=org,
        defaults={
            "department": it,
            "employee_id": "EMP002",
            "is_first_login": False,
        }
    )

    print("Employees created")

    # =============================
    # 5️⃣ DEPARTMENT WORK
    # =============================

    work1, _ = DepartmentWork.objects.get_or_create(
        organisation=org,
        department=hr
    )
    work1.employees.add(emp1)

    work2, _ = DepartmentWork.objects.get_or_create(
        organisation=org,
        department=it
    )
    work2.employees.add(emp2)

    print("Department work assigned")

    # =============================
    # 6️⃣ COMPLAINTS
    # =============================

    complaint1 = Complaint.objects.create(
        user_email="customer1@gmail.com",
        organisation=org,
        department=hr,
        description="Salary not credited properly.",
        severity="3"
    )

    complaint2 = Complaint.objects.create(
        user_email="customer2@gmail.com",
        organisation=org,
        department=it,
        description="System outage in office network.",
        severity="4"
    )

    print("Complaints created")
    print("Seeding completed successfully!")


seed()