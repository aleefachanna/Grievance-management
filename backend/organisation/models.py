from django.db import models
from django.utils.text import slugify
import uuid

class Organisation(models.Model):

    ORGANISATION_TYPE_CHOICES = [
        ('private', 'Private'),
        ('government', 'Government'),
        ('ngo', 'NGO'),
        ('educational', 'Educational'),
    ]

    # Unique internal ID (safer than custom org_id string logic)
    org_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    
    industry = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    admin_name = models.CharField(max_length=100, blank=True)
    admin_email = models.EmailField(blank=True)
    organisation_type = models.CharField(
        max_length=20,
        choices=ORGANISATION_TYPE_CHOICES
    )

    description = models.TextField(blank=True)

    # Branding
    logo = models.ImageField(upload_to="organisation_logos/", blank=True, null=True)

    # Contact Info
    official_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True)

    website = models.URLField(blank=True)

    # Location (simplified & clean)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)

    # System fields
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name