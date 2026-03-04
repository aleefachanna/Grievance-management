from django.shortcuts import render, redirect
from .forms import OrganisationForm
from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Organisation
from .serializers import OrganisationSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import OrganisationCreateSerializer

@api_view(['POST'])
def create_organisation(request):
    serializer = OrganisationCreateSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['GET'])
def get_organisation(request, slug):
    try:
        org = Organisation.objects.get(slug=slug)
        serializer = OrganisationSerializer(org)
        return Response(serializer.data)
    except Organisation.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

@api_view(['GET'])
def search_organisations(request):
    query = request.GET.get('q', '')

    if not query:
        return Response([])

    organisations = Organisation.objects.filter(
        Q(name__icontains=query) |
        Q(city__icontains=query) |
        Q(state__icontains=query) |
        Q(country__icontains=query) |
        Q(description__icontains=query) |
        Q(organisation_type__icontains=query)
    ).filter(is_active=True)[:10]  # limit suggestions

    serializer = OrganisationSerializer(organisations, many=True)
    return Response(serializer.data)

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
