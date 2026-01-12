from django.db import models

# 1. Define Organisation first (because Department and Complaint depend on it)
class Organisation(models.Model):
    name = models.CharField(max_length=255)
    
    def __str__(self):
        return self.name

# 2. Define Department second (it depends on Organisation)
class Department(models.Model):
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=100)
    dept_id = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return f"{self.name} ({self.organisation.name})"

# 3. Define Complaint last (it depends on both Organisation and Department)
class Complaint(models.Model):
    user_email = models.EmailField()
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    ai_summary = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Complaint {self.id} - {self.organisation.name}"