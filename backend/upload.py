from django.contrib.auth.models import User
from organisation.models import Organisation
from core.models import Department, Employee, Manager, Complaint, DepartmentWork
from django.utils import timezone

print("Starting DB seed...")

# -----------------------------
# 1️⃣ CREATE ORGANISATIONS
# -----------------------------

bmh, _ = Organisation.objects.get_or_create(
    name="BMH Hospital",
    defaults={
        "organisation_type": "private",
        "industry": "Healthcare",
        "description": "Multi-speciality hospital providing advanced medical services.",
        "official_email": "contact@bmhospital.com",
        "contact_phone": "9876543210",
        "website": "https://bmhospital.com",
        "city": "Kochi",
        "state": "Kerala",
        "country": "India",
        "admin_name": "Dr. Thomas",
        "admin_email": "admin@bmhospital.com"
    }
)

indulekha, _ = Organisation.objects.get_or_create(
    name="Indulekha Soup",
    defaults={
        "organisation_type": "private",
        "industry": "Food & Beverage",
        "description": "Premium organic soup manufacturing company.",
        "official_email": "info@indulekhasoup.com",
        "contact_phone": "9123456780",
        "website": "https://indulekhasoup.com",
        "city": "Thrissur",
        "state": "Kerala",
        "country": "India",
        "admin_name": "Ms. Indu",
        "admin_email": "admin@indulekhasoup.com"
    }
)

# -----------------------------
# 2️⃣ CREATE DEPARTMENTS
# -----------------------------

bmh_admin = Department.objects.get_or_create(
    organisation=bmh,
    name="Administration",
    dept_id="BMH-ADMIN"
)[0]

bmh_it = Department.objects.get_or_create(
    organisation=bmh,
    name="IT Support",
    dept_id="BMH-IT"
)[0]

soup_prod = Department.objects.get_or_create(
    organisation=indulekha,
    name="Production",
    dept_id="IND-PROD"
)[0]

soup_sales = Department.objects.get_or_create(
    organisation=indulekha,
    name="Sales",
    dept_id="IND-SALES"
)[0]

# -----------------------------
# 3️⃣ CREATE USERS + EMPLOYEES
# -----------------------------

def create_employee(username, password, name, dept, org, emp_id):
    user, _ = User.objects.get_or_create(username=username)
    user.set_password(password)
    user.save()

    emp, _ = Employee.objects.get_or_create(
        user=user,
        defaults={
            "name": name,
            "department": dept,
            "employeeid": emp_id,
            "organisation": org
        }
    )
    return emp

emp1 = create_employee("bmh_emp1", "password123", "Anil Kumar", bmh_admin, bmh, "BMH-E001")
emp2 = create_employee("bmh_emp2", "password123", "Divya Nair", bmh_it, bmh, "BMH-E002")
emp3 = create_employee("soup_emp1", "password123", "Rahul Das", soup_prod, indulekha, "IND-E001")

# -----------------------------
# 4️⃣ CREATE MANAGERS
# -----------------------------

def create_manager(username, password, name, org, manager_id):
    user, _ = User.objects.get_or_create(username=username)
    user.set_password(password)
    user.save()

    manager, _ = Manager.objects.get_or_create(
        user=user,
        defaults={
            "name": name,
            "organisation": org,
            "managerid": manager_id
        }
    )
    return manager

create_manager("bmh_manager", "password123", "Dr. Joseph", bmh, "BMH-M001")
create_manager("soup_manager", "password123", "Ms. Indu Manager", indulekha, "IND-M001")

# -----------------------------
# 5️⃣ CREATE COMPLAINTS
# -----------------------------

complaint1 = Complaint.objects.create(
    user_email="patient1@gmail.com",
    organisation=bmh,
    description="Long waiting time in emergency ward.",
    severity="3"
)

complaint1.departments.add(bmh_admin)

complaint2 = Complaint.objects.create(
    user_email="customer@gmail.com",
    organisation=indulekha,
    description="Soup packaging damaged during delivery.",
    severity="2"
)

complaint2.departments.add(soup_sales)

# -----------------------------
# 6️⃣ CREATE DEPARTMENT WORK
# -----------------------------

work1 = DepartmentWork.objects.create(
    department=bmh_admin,
    title="Investigate emergency delay",
    description="Check staffing and queue system."
)

work1.employees.add(emp1)
complaint1.works.add(work1)

print("Database successfully seeded.")