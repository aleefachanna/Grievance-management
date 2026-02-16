from django.shortcuts import render, redirect
from .forms import OrganisationForm
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import Complaint, Manager

def create_organisation(request):
    if request.method == 'POST':
        form = OrganisationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('success')
    else:
        form = OrganisationForm()

    return render(request, 'organisation/form.html', {'form': form})

def organisation_success(request):
    return render(request, 'organisation/success.html')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def organisation_dashboard(request):
    try:
        manager = Manager.objects.get(user=request.user)
    except Manager.DoesNotExist:
        return Response(
            {"error": "Not an organisation admin"},
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

    return Response(data)