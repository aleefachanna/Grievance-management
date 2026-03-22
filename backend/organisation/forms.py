from django import forms
from core.models import Organisation

class OrganisationForm(forms.ModelForm):
    class Meta:
        model = Organisation
        fields = [
            'name',
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
