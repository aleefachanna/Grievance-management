from rest_framework.permissions import BasePermission
from core.models import Employee


class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsHOD(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        try:
            employee = request.user.employee
            return employee.isHod
        except Employee.DoesNotExist:
            return False