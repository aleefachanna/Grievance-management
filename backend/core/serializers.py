from rest_framework import serializers
from .models import (
    Complaint,
    Department,
    DepartmentWork,
    Employee,
    Organisation,
    ComplaintUpdate
)


# =========================================================
# ORGANISATION
# =========================================================

class OrganisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation
        fields = [
            "id",
            "name",
            "description",
            "slug",
            "city",
            "state",
            "organisation_type",
            "logo",
        ]
        read_only_fields = ["id", "slug"]


# =========================================================
# DEPARTMENT
# =========================================================

class DepartmentSerializer(serializers.ModelSerializer):
    organisation = serializers.CharField(source="organisation.name", read_only=True)

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "organisation",
        ]
        read_only_fields = fields


# =========================================================
# EMPLOYEE (SAFE VERSION)
# =========================================================

class EmployeeSerializer(serializers.ModelSerializer):
    organisation_name = serializers.CharField(source="organisation.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    name = serializers.CharField(source="user.first_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    is_hod = serializers.BooleanField(source="isHod", read_only=True)

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_id",
            "name",
            "email",
            "organisation_name",
            "department_name",
            "is_hod",
            "is_first_login",
            "is_active",
        ]
        read_only_fields = fields



# =========================================================
# COMPLAINT – CREATE
# =========================================================

class ComplaintCreateSerializer(serializers.ModelSerializer):
    """
    Used when creating a complaint.
    System-controlled fields are excluded.
    """

    class Meta:
        model = Complaint
        fields = [
            "organisation",
            "department",
            "description",
            "severity",
            "attachment",
        ]


# =========================================================
# COMPLAINT UPDATES
# =========================================================

class ComplaintUpdateSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintUpdate
        fields = ["id", "author", "message", "is_public", "created_at"]
        read_only_fields = fields
        
    def get_author(self, obj):
        if obj.author:
            return obj.author.first_name or obj.author.username
        return "System"

# =========================================================
# COMPLAINT – DETAIL / READ
# =========================================================

class ComplaintDetailSerializer(serializers.ModelSerializer):
    organisation = serializers.CharField(source="organisation.name", read_only=True)
    department = serializers.CharField(source="department.name", read_only=True)
    updates = ComplaintUpdateSerializer(many=True, read_only=True)
    assigned_employees = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            "id",
            "complaint_id",
            "organisation",
            "department",
            "description",
            "severity",
            "status",
            "attachment",
            "deadline",
            "ai_summary",
            "created_at",
            "closed_at",
            "updates",
            "assigned_employees",
        ]
        read_only_fields = fields

    def get_assigned_employees(self, obj):
        return [
            {
                "id": str(e.id), 
                "name": f"{e.user.first_name} {e.user.last_name}".strip() or e.user.username
            } 
            for e in obj.assigned_employees.all()
        ]


# =========================================================
# COMPLAINT – TRACKING (PUBLIC SAFE VERSION)
# =========================================================

class ComplaintTrackSerializer(serializers.ModelSerializer):
    organisation = serializers.CharField(source="organisation.name", read_only=True)
    public_updates = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            "complaint_id",
            "organisation",
            "status",
            "severity",
            "description",
            "attachment",
            "deadline",
            "created_at",
            "closed_at",
            "public_updates"
        ]
        read_only_fields = fields
        
    def get_public_updates(self, obj):
        updates = obj.updates.filter(is_public=True).order_by('created_at')
        return ComplaintUpdateSerializer(updates, many=True).data


# =========================================================
# DEPARTMENT WORK
# =========================================================

class DepartmentWorkSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source="department.name", read_only=True)
    complaints = serializers.SerializerMethodField()
    assigned_employees = serializers.SerializerMethodField()

    class Meta:
        model = DepartmentWork
        fields = [
            "id",
            "title",
            "description",
            "complaints",
            "department",
            "status",
            "assigned_employees",
            "created_at",
            "closed_at",
        ]
        read_only_fields = ["id", "department", "complaints", "status", "created_at", "closed_at", "assigned_employees"]
        
    def get_complaints(self, obj):
        return [c.complaint_id for c in obj.complaints.all()]

    def get_assigned_employees(self, obj):
        names = []
        for emp in obj.employees.all():
            name = emp.user.get_full_name().strip()
            if not name:
                name = emp.user.username
            names.append({"id": str(emp.id), "name": name})
        return names