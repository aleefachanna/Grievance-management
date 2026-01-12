from django.shortcuts import render, redirect
from django.contrib import messages

# Use relative imports (the dot means 'this current app folder')
from .models import Organisation, Department, Complaint

# Ensure your file is named service.py or utils.py and match it here
from .service import classify_and_summarize

def submit_complaint(request):
    if request.method == "POST":
        org_id = request.POST.get('organisation')
        description = request.POST.get('description')
        email = request.POST.get('email')

        # 1. Get the organisation and its departments
        organisation = Organisation.objects.get(id=org_id)
        dept_queryset = Department.objects.filter(organisation=organisation)
        dept_names = list(dept_queryset.values_list('name', flat=True))

        try:
            # 2. Call Groq Service
            ai_result = classify_and_summarize(description, dept_names)
            
            # 3. Match AI response to a Department object
            # Use 'icontains' to be safe with casing
            assigned_dept = dept_queryset.filter(name__icontains=ai_result['department']).first()

            # 4. Save to Supabase
            Complaint.objects.create(
                user_email=email,
                organisation=organisation,
                department=assigned_dept,
                description=description,
                ai_summary=ai_result['summary']
            )
            messages.success(request, f"Complaint submitted and routed to {ai_result['department']}!")
            return redirect('submit_complaint')

        except Exception as e:
            messages.error(request, f"Error processing complaint: {e}")
            
    organisations = Organisation.objects.all()
    return render(request, 'submit_form.html', {'organisations': organisations})