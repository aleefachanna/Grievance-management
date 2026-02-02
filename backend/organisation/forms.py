from django import forms
from .models import Organisation

class OrganisationForm(forms.ModelForm):
    class Meta:
        model = Organisation
        fields = [
            'company_name',
            'organisation_type',
            'industry',
            'official_email',
            'contact_phone',
            'address',
            'city',
            'state',
            'country',
            'admin_name',
            'admin_email',
            'is_active'
        ]
