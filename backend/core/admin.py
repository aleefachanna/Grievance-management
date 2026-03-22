from django.contrib import admin
from .models import Department, Complaint, Employee, Manager, DepartmentWork,Organisation
admin.site.register(Organisation)
admin.site.register(Department)
admin.site.register(Employee)
admin.site.register(Manager)
admin.site.register(Complaint)
admin.site.register(DepartmentWork)