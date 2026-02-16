from rest_framework import serializers
from .models import Complaint, Department, DepartmentWork, Employee
from organisation.models import Organisation
# serializers.py

class ComplaintTrackSerializer(serializers.ModelSerializer):
    organisation = serializers.CharField(source='organisation.name')

    class Meta:
        model = Complaint
        fields = [
            'complaint_id',
            'organisation',
            'status',
            'severity',
            'description',
            'created_at',
            'closed_at'
        ]
class OrganisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation
        fields = ['id', 'name']

class DepartmentWorkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentWork
        fields = '__all__'

class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = '__all__'