from django.db import models

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

    def __str__(self):
        return f"{self.title} - {self.organisation.name}"
    def __str__(self):
        return self.name
