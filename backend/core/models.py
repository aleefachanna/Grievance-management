from django.db import models
from django.contrib.auth.models import User

# 1. Define Organisation first (because Department and Complaint depend on it)
class Organisation(models.Model):
    name = models.CharField(max_length=255)
    OrgId = models.CharField(max_length=50, unique=True)
    def __str__(self):
        return self.name

# 2. Define Department second (it depends on Organisation)
class Department(models.Model):
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=100)
    dept_id = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return f"{self.name} ({self.organisation.name})"
class DepartmentWork(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("WORKING", "Working"),
        ("DONE", "Done"),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)


# 3. Define Complaint last (it depends on both Organisation and Department)
class Complaint(models.Model):
    user_email = models.EmailField()
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    departments = models.ManyToManyField(
    'Department',
    blank=True
)

    description = models.TextField()
    SEVERITY_CHOICES = [
        ('0', '0 - None'),
        ('1', '1 - Very Low'),
        ('2', '2 - Low'),
        ('3', '3 - Medium'),
        ('4', '4 - High'),
        ('5', '5 - Critical'),
    ]

    severity = models.CharField(
        max_length=1,
        choices=SEVERITY_CHOICES,
        blank=True,   # optional
        default='0'
    )
    ai_summary = models.TextField(blank=True)
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('WORKING', 'Working On'),
        ('CLOSED', 'Closed'),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    works = models.ManyToManyField(DepartmentWork, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Complaint {self.id} - {self.organisation.name}"
class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    employeeid = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.name

class Manager(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    managerid = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.name

    def __str__(self):
        return self.title
