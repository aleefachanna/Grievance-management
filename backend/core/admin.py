from django.contrib import admin
from .models import Organisation, Department, Complaint

admin.site.register(Organisation)
admin.site.register(Department)
admin.site.register(Complaint)