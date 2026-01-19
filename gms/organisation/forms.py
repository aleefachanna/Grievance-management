from django import forms
from .models import Organisation

class OrganisationForm(forms.ModelForm):
    class Meta:
        model = Organisation
        fields = [
            'company_name',
            'address',
            'contact_email',
            'contact_phone',
            'website'
        ]
