from django.db import models
from django.utils.text import slugify
import uuid

class Organisation(models.Model):

    ORGANISATION_TYPE_CHOICES = [
        ('for_profit', 'For-Profit'),
        ('non_profit', 'Non-Profit'),
        ('govt', 'Government'),
        ('sole_proprietorship', 'Sole Proprietorship'),
        ('partnership', 'Partnership'),
        ('company', 'Company'),
        ('cooperative', 'Cooperative Society'),
    ]

    cin = models.CharField(max_length=50, unique=True) # Changed from org_id
    gstin = models.CharField(max_length=15, unique=True)

    organisation_types = models.JSONField(default=list, blank=True)
    industry = models.CharField(max_length=100)
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
    
class Grievance(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    # Link to the organisation
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name='grievances')
    
    # Grievance Details
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100) # e.g., HR, IT, Infrastructure
    
    # Status and Priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Tracking
    submitted_by = models.EmailField() # Email of the person who filed it
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.organisation.name}"
    def __str__(self):
        return self.name
