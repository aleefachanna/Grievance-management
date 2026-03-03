from django.shortcuts import render, redirect
from .forms import OrganisationForm
#from rest_framework.decorators import api_view, permission_classes
#from rest_framework.permissions import IsAuthenticated
#from rest_framework.response import Response
from core.models import Complaint, Manager
from django.contrib.auth.decorators import login_required
def create_organisation(request):
    if request.method == 'POST':
        # The form now knows organisation_types is a list
        form = OrganisationForm(request.POST) 
        if form.is_valid():
            form.save()
            return redirect('success')
    else:
        form = OrganisationForm()

    return render(request, 'organisation/form.html', {'form': form})

def organisation_success(request):
    return render(request, 'organisation/success.html')
#@api_view(['GET'])
#@permission_classes([IsAuthenticated])
@login_required
def organisation_dashboard(request):
    try:
        manager = Manager.objects.get(user=request.user)
    except Manager.DoesNotExist:
        return render(
            request,
            "organisation/not_authorized.html",
            status=403
        )

    org = manager.organisation
    complaints = Complaint.objects.filter(organisation=org)

    data = {
        "organisation": org.name,
        "total_complaints": complaints.count(),
        "pending": complaints.filter(status="PENDING").count(),
        "working": complaints.filter(status="WORKING").count(),
        "closed": complaints.filter(status="CLOSED").count(),
    }

    return render(request, "organisation/dashboard.html", data)