import os
import django
import random

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from core.models import Organisation, Department, Employee, Manager, Complaint


def run():

    print("Seeding database...")

    # ---------------- ORGANISATION ----------------
    org, _ = Organisation.objects.get_or_create(
        name="Tech University",
        slug="tech-university",
        organisation_type="educational",
        official_email="admin@techuniversity.com",
        city="Kochi",
        state="Kerala",
        country="India",
        description="Demo organisation for grievance system"
    )

    print("Organisation created")

    # ---------------- DEPARTMENTS ----------------
    departments = []

    dept_names = ["IT", "HR", "Maintenance", "Finance"]

    for name in dept_names:
        dept, _ = Department.objects.get_or_create(
            name=name,
            organisation=org
        )
        departments.append(dept)

    print("Departments created")

    # ---------------- MANAGER ----------------
    manager_user, _ = User.objects.get_or_create(
        username="manager1",
        email="manager@tech.com"
    )
    manager_user.set_password("password123")
    manager_user.save()

    Manager.objects.get_or_create(
        user=manager_user,
        organisation=org,
        is_owner=True
    )

    print("Manager created")

    # ---------------- EMPLOYEES ----------------
    employees = []

    for i in range(5):
        user = User.objects.create_user(
            username=f"employee{i}",
            email=f"employee{i}@tech.com",
            password="password123",
            first_name=f"Emp{i}",
            last_name="User"
        )

        emp = Employee.objects.create(
            user=user,
            employee_id=f"EMP00{i}",
            organisation=org,
            department=random.choice(departments),
            isHod=(i == 0)
        )

        employees.append(emp)

    print("Employees created")

    # ---------------- COMPLAINTS ----------------
    for i in range(5):
        Complaint.objects.create(
            user_email=f"user{i}@gmail.com",
            organisation=org,
            department=random.choice(departments),
            description=f"Sample complaint {i}",
            severity=str(random.randint(1, 5))
        )

    print("Complaints created")

    print("Database seeding complete!")


if __name__ == "__main__":
    run()