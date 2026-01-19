from django.db import models

class Organisation(models.Model):
    company_name = models.CharField(max_length=200)
    address = models.TextField()
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=15)
    website = models.URLField(blank=True)

    def __str__(self):
        return self.company_name
