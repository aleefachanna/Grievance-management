from rest_framework import serializers
from .models import (
    Complaint,
    Department,
    DepartmentWork,
    Employee,
    Organisation
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
    organisation = serializers.CharField(source="organisation.name", read_only=True)
    department = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Employee
        fields = [
            "id",
            "name",
            "organisation",
            "department",
            "email",
            "isFirstlogin",
        ]
        read_only_fields = [
            "id",
            "organisation",
            "email",
        ]


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
        ]


# =========================================================
# COMPLAINT – DETAIL / READ
# =========================================================

class ComplaintDetailSerializer(serializers.ModelSerializer):
    organisation = serializers.CharField(source="organisation.name", read_only=True)
    department = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Complaint
        fields = [
            "complaint_id",
            "organisation",
            "department",
            "description",
            "severity",
            "status",
            "ai_summary",      # safe if exists
            "created_at",
            "closed_at",
        ]
        read_only_fields = fields


# =========================================================
# COMPLAINT – TRACKING (PUBLIC SAFE VERSION)
# =========================================================

class ComplaintTrackSerializer(serializers.ModelSerializer):
    organisation = serializers.CharField(source="organisation.name", read_only=True)

    class Meta:
        model = Complaint
        fields = [
            "complaint_id",
            "organisation",
            "status",
            "severity",
            "description",
            "created_at",
            "closed_at",
        ]
        read_only_fields = fields


# =========================================================
# DEPARTMENT WORK
# =========================================================

class DepartmentWorkSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source="department.name", read_only=True)
    complaint = serializers.CharField(source="complaint.complaint_id", read_only=True)

    class Meta:
        model = DepartmentWork
        fields = [
            "id",
            "complaint",
            "department",
            "status",
            "created_at",
            "closed_at",
        ]
        read_only_fields = fields