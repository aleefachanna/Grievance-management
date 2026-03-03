from django.db import models

class Organisation(models.Model):
    ORGANISATION_TYPE_CHOICES = [
        ('private', 'Private'),
        ('government', 'Government'),
        ('ngo', 'NGO'),
        ('educational', 'Educational'),
    ]

    name = models.CharField(max_length=255)
    cin = models.CharField(max_length=50, unique=True) # Changed from org_id
    gstin = models.CharField(max_length=15, unique=True)

    organisation_types = models.JSONField(default=list, blank=True)
    industry = models.CharField(max_length=100)

    official_email = models.EmailField()
    contact_phone = models.CharField(max_length=15)

    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)

    admin_name = models.CharField(max_length=100)
    admin_email = models.EmailField()

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
