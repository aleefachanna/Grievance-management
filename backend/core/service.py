import os
import json
from groq import Groq
from django.conf import settings

# Make sure "GROQ_KEY" matches the name in your .env file
client = Groq(api_key=os.environ.get("GROQ_KEY"))

def classify_and_summarize(complaint_text, department_info, attachment_type=None, attachment_data=None, severity_guidelines=None):
    """
    Sends complaint to Groq to get departments, summary, and severity.
    Handles text or image attachment via LLaVA model.
    Uses organisation guidelines to constrain severity ratings.
    """

    # Extract name and description pairs
    dept_strings = [f"{d['name']} (Description: {d.get('description', 'No description')})" for d in department_info]
    dept_list_str = "\n".join(f"- {d}" for d in dept_strings)
    
    guideline_text = f"Severity Constraints for this Organisation:\n{severity_guidelines}\n" if severity_guidelines else "Evaluate severity purely objectively."

    prompt = f"""
You are a complaint triage assistant for an organization.

Available Departments and their roles:
{dept_list_str}

Severity Scale Anchors:
0 = None (Non-issue or spam)  
1 = Very Low (Minor typo, simple query, or aesthetic preference)  
2 = Low (Minor inconvenience, slow response that isn't urgent)  
3 = Medium (Significant delay, local disruption, or service outage)  
4 = High (Significant impact on multiple people, safety risk, or regulatory breach)  
5 = Critical (Immediate danger to life, critical infrastructure failure, or severe widespread emergency)  

{guideline_text}
CRITICAL: Do NOT default all complaints to High. You MUST be objective and conservative with severity. A 'Broken streetlight' is Medium/Low, whereas 'Gas leak' is Critical. If an organisation's guidelines are vague, lean toward the lower end of the scale unless clear harm is present.

Complaint:
"{complaint_text}"

Instructions:
1. Select one relevant department from the list.
2. Choose more than one ONLY if the complaint clearly involves multiple areas.
3. If NONE of the departments apply, return an EMPTY list.
4. Write a concise 1-sentence summary.
5. Assign a severity from 0 to 5 based on the anchors above.
6. Return ONLY valid JSON in this format:

{{
  "departments": [],
  "summary": "The summary text",
  "severity": "0"
}}

Rules:
- Departments MUST be selected only from the names of the departments provided above. Return ONLY the names, not the descriptions.
- Always return an array of strings for "departments".
- Severity must be a STRING between "0" and "5". Adhere strictly to the organisation guidelines and anchors.
"""

    if attachment_type == "text" and attachment_data:
        prompt += f"\n\nAttachment Text:\n{attachment_data}"

    messages = []
    model_name = "llama-3.3-70b-versatile"
    kwargs = {"response_format": {"type": "json_object"}}

    if attachment_type == "image" and attachment_data:
        model_name = "llama-3.2-11b-vision-preview"
        # Vision model compatibility
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{attachment_data}"}
                    }
                ]
            }
        ]
        # Some vision models on Groq might not fully support structured JSON mode
        # removing response_format constraint if it causes issues, but we'll try strict json format.
    else:
        messages = [{"role": "user", "content": prompt}]

    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=model_name,
            **kwargs,
        )
        response_text = chat_completion.choices[0].message.content
        return json.loads(response_text)
    except Exception as e:
        # Fallback if json_object format is not supported by vision model
        if attachment_type == "image" and "json_object" in str(e):
            chat_completion = client.chat.completions.create(
                messages=messages,
                model=model_name,
            )
            response_text = chat_completion.choices[0].message.content
            # Best effort to find JSON in response
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                return json.loads(response_text[start:end+1])
            raise e
        else:
            raise e

def summarize_department_work(complaints_texts, department_name):
    combined_text = "\n".join(
        [f"- {c}" for c in complaints_texts]
    )

    prompt = f"""
You are a department manager assistant.

Department: {department_name}

Below are complaints received:

{combined_text}

Instructions:
1. Read all complaints.
2. Identify concrete tasks the department must work on.
3. Merge similar issues.
4. Keep tasks actionable.
5. Return ONLY valid JSON in this format:

{{
  "summary": "Short overview of the department situation.",
  "tasks": [
     "Task one",
     "Task two",
     "Task three"
  ]
}}
"""

    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
    )

    return json.loads(chat_completion.choices[0].message.content)

def summarize_organisation_complaints(complaints_texts, org_name):
    combined_text = "\n".join(
        [f"- {c}" for c in complaints_texts]
    )

    prompt = f"""
You are an executive assistant for an organization.

Organization: {org_name}

Below are recent complaints received:

{combined_text}

Instructions:
1. Read all complaints.
2. Provide a high-level executive summary of the current state of grievances.
3. Identify 2-3 key recurring themes or urgent issues.
4. Keep the tone professional and analytical.
5. Return ONLY valid JSON in this format:

{{
  "summary": "High-level overview paragraph.",
  "key_issues": [
     "Issue one",
     "Issue two"
  ]
}}
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error in org summary: {e}")
        return {"summary": "Unable to generate summary at this time.", "key_issues": []}

def ai_assign_works(complaints, works):
    work_titles = [w.title for w in works]
    # Formatting complaints so the AI sees the ID and the text clearly
    combined = "\n".join([f"ID {c.id}: {c.description}" for c in complaints])

    prompt = f"""
    You are a task assignment specialist.
    
    Works Available (Titles): 
    {work_titles}

    Complaints to Process:
    {combined}

    Instructions:
    Match each complaint to the most relevant Work Title(s). 
    If no work matches, do not include that complaint ID in the mapping.

    Return ONLY JSON in this format:
    {{
      "mapping": {{
         "complaint_id": ["Work Title 1", "Work Title 2"]
      }}
    }}
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}, # Forces valid JSON
        )

        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error in assignment: {e}")
        return {"mapping": {}}


def ai_assign_employees(complaints, employees_data):
    # employees_data is expected to be a list of dicts: [{'id': 1, 'name': 'John', 'count': 2}]
    emp_info = "\n".join([f"Employee ID: {e['id']} | Name: {e['name']} | Current Complaints Load: {e['count']}" for e in employees_data])
    combined_complaints = "\n".join([f"Complaint ID {c.id}: {c.description}" for c in complaints])

    prompt = f"""
    You are an intelligent organizational workload distributor.
    
    Employees available in this department (with their current task loads): 
    {emp_info}

    Unassigned Pending Complaints:
    {combined_complaints}

    Instructions:
    Assign each unassigned complaint to EXACTLY ONE employee ID. 
    You MUST prioritize assigning work to employees with the lowest 'Current Complaints Load' to perfectly balance the total workloads among the staff.

    Return ONLY JSON in this format:
    {{
      "mapping": {{
         "complaint_id": "employee_id"
      }}
    }}
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error in employee assignment: {e}")
        return {"mapping": {}}


def ai_auto_manage_works(active_works, unassigned_complaints):
    works_data = "\n".join([f"WORK_ID {w.id}: {w.title} - {w.description}" for w in active_works])
    complaints_data = "\n".join([f"COMPLAINT_ID {c.id}: {c.description}" for c in unassigned_complaints])

    prompt = f"""
    You are an AI department manager.
    Your job is to manage unassigned complaints by either assigning them to Existing Works, or grouping them into New Works.
    
    Active Existing Works:
    {works_data if works_data else "None"}
    
    Unassigned Pending Complaints:
    {complaints_data if complaints_data else "None"}
    
    Instructions:
    1. First, try to map complaints to Existing Works if they are highly related.
    2. For complaints that don't fit any Existing Work, group them together, suggest a concise title and description, and create New Works.
    3. Output in the following EXACT JSON format:
    {{
      "assign_to_existing": [
        {{
           "work_id": "WORK_ID_HERE",
           "complaint_ids": ["uuid-1", "uuid-2"]
        }}
      ],
      "create_new": [
        {{
           "title": "Title of new work",
           "description": "Detailed description of the new manual workload",
           "complaint_ids": ["uuid-3"]
        }}
      ]
    }}
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}, 
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error in Auto Manage Works: {e}")
        return {"assign_to_existing": [], "create_new": []}

def ai_draft_resolution_email(complaint_desc, department_name):
    prompt = f"""
    You are an automated department manager communicating directly with a resident.
    Department: {department_name}
    Grievance Description: {complaint_desc}
    
    Instructions:
    Draft a polite, professional 2-3 sentence email stating that their grievance has been fully resolved and marked as closed by the department.
    Do not include salutations like "Hi," or signatures like "Best Regards," as the system handles those wrappers.
    Output ONLY JSON in the exact format:
    {{ "draft": "Your email draft goes here..." }}
    """
    try:
        res = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}, 
        )
        return json.loads(res.choices[0].message.content).get("draft", "Your grievance has been successfully resolved.")
    except Exception as e:
        print(f"Groq API Error in Email Draft: {e}")
        return "Your grievance has been successfully resolved."