from django import forms
from .models import Organisation

class OrganisationForm(forms.ModelForm):
    # We define the choices here to match the Model and React
    TYPE_CHOICES = [
        ('for_profit', 'For-Profit'),
        ('non_profit', 'Non-Profit'),
        ('govt', 'Government'),
        ('sole_proprietorship', 'Sole Proprietorship'),
        ('partnership', 'Partnership'),
        ('company', 'Company'),
        ('cooperative', 'Cooperative Society'),
    ]

    # Override the field to use Checkboxes
    organisation_types = forms.MultipleChoiceField(
        choices=TYPE_CHOICES,
        widget=forms.CheckboxSelectMultiple, # This allows multiple ticks
        required=False
    )

    class Meta:
        model = Organisation
        fields = [
            'cin', 'gstin', 'name', 'organisation_types', 
            'industry', 'official_email', 'contact_phone', 
            'address', 'city', 'state', 'country', 
            'admin_name', 'admin_email', 'is_active'
        ]