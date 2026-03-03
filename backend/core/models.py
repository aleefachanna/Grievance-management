from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.utils.text import slugify
import uuid
from django.contrib.auth.models import User
from django.db import transaction

# ----------------- ORGANISATION -----------------
class Organisation(models.Model):
    ORGANISATION_TYPE_CHOICES = [
        ('private', 'Private'),
        ('government', 'Government'),
        ('ngo', 'NGO'),
        ('educational', 'Educational'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    logo = models.ImageField(upload_to="organisation_logos/", null=True, blank=True)
    description = models.TextField(blank=True)
    organisation_type = models.CharField(max_length=20, choices=ORGANISATION_TYPE_CHOICES)
    official_email = models.EmailField()

    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return self.name
# ----------------- DEPARTMENT -----------------
class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    description = models.TextField(blank=True)
    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name='departments'
    )

    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('organisation', 'name')
        indexes = [
            models.Index(fields=["organisation"]),
        ]

# ----------------- EMPLOYEE -----------------


class Employee(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    isHod = models.BooleanField(default=False)
    employee_id = models.CharField(max_length=20)
    is_first_login = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='employee_profile'
    )

    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name='employees'
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    class Meta:
        unique_together = ('organisation', 'employee_id')
        indexes = [
            models.Index(fields=["organisation", "employee_id"]),
        ]

    def __str__(self):
        return f"{self.employee_id} | {self.user.get_full_name()}"
# ----------------- MANAGER -----------------
class Manager(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="manager_profile"
    )

    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name="managers"
    )

    is_owner = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.get_full_name()} | {self.organisation.name}"

# ----------------- DEPARTMENT WORK -----------------
class DepartmentWork(models.Model):
    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("IN_PROGRESS", "In Progress"),
        ("REQUESTED_CLOSE", "Requested Close"),
        ("CLOSED", "Closed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name="works"
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='works'
    )

    employees = models.ManyToManyField(
        Employee,
        blank=True,
        related_name='works'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        indexes = [
            models.Index(fields=["organisation"]),
        ]

    def clean(self):
        # Prevent cross-organisation linking
        if self.department.organisation != self.organisation:
            raise ValidationError("Department must belong to same organisation.")

    def __str__(self):
        return f"{self.department.name} Work"
# ----------------- COMPLAINT -----------------

class Complaint(models.Model):
    SEVERITY_CHOICES = [
        ('0', '0 - None'),
        ('1', '1 - Very Low'),
        ('2', '2 - Low'),
        ('3', '3 - Medium'),
        ('4', '4 - High'),
        ('5', '5 - Critical'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('WORKING', 'Working On'),
        ('CLOSED', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint_id = models.CharField(max_length=50, blank=True)
    user_email = models.EmailField()

    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name='complaints'
    )

    department = models.ForeignKey(
        Department,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name='complaints'
    )

    description = models.TextField()
    severity = models.CharField(max_length=1, choices=SEVERITY_CHOICES, default='0')
    ai_summary = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    works = models.ManyToManyField(
        DepartmentWork,
        blank=True,
        related_name='complaints'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('organisation', 'complaint_id')
        indexes = [
            models.Index(fields=["organisation"]),
        ]

    def save(self, *args, **kwargs):
        if not self.complaint_id:
            with transaction.atomic():
                today = timezone.now().strftime("%Y%m%d")

                count = Complaint.objects.select_for_update().filter(
                    organisation=self.organisation,
                    complaint_id__startswith=f"CMP-{today}"
                ).count()

                self.complaint_id = f"CMP-{today}-{count+1:05d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.complaint_id} | {self.organisation.name}"