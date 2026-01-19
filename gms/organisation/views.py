from django.shortcuts import render, redirect
from .forms import OrganisationForm

def organisation_create(request):
    if request.method == 'POST':
        form = OrganisationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('success')
    else:
        form = OrganisationForm()

    return render(request, 'organisation/form.html', {'form': form})

def success(request):
    return render(request, 'organisation/success.html')
