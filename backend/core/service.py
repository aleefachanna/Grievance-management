import os
import json
from groq import Groq
from django.conf import settings

# Make sure "GROQ_KEY" matches the name in your .env file
client = Groq(api_key=os.environ.get("GROQ_KEY"))

def classify_and_summarize(complaint_text, department_list):
    """
    Sends complaint to Groq to get departments, summary, and severity.
    """

    prompt = f"""
You are a complaint triage assistant for an organization.

Available Departments:
{", ".join(department_list)}

Severity Scale:
0 = None / Not an issue  
1 = Very Low  
2 = Low  
3 = Medium  
4 = High  
5 = Critical  

Complaint:
"{complaint_text}"

Instructions:
1. Select one relevant department from the list.
2. Choose more than one ONLY if the complaint clearly involves multiple areas.
3. If NONE of the departments apply, return an EMPTY list.
4. Write a concise 1-sentence summary.
5. Assign a severity from 0 to 5 based on urgency, harm, and impact.
6. Return ONLY valid JSON in this format:

{{
  "departments": [],
  "summary": "The summary text",
  "severity": "0"
}}

Rules:
- Departments must come only from the provided list.
- Always return an array for "departments".
- Severity must be a STRING between "0" and "5".
"""

    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
    )

    return json.loads(chat_completion.choices[0].message.content)

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