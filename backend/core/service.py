import os
import json
from groq import Groq
from django.conf import settings

# Make sure "GROQ_KEY" matches the name in your .env file
client = Groq(api_key=os.environ.get("GROQ_KEY"))

def classify_and_summarize(complaint_text, department_list):
    """
    Sends complaint to Groq to get the department and a summary.
    """
    
    # We use double braces here because it IS an f-string 
    # and we want the AI to see single braces.
    prompt = f"""
    You are a complaint classifier for an organization. 
    Available Departments: {", ".join(department_list)}
    
    Complaint: "{complaint_text}"
    
    Instructions:
    1. Pick the best department from the list above.
    2. Provide a concise 1-sentence summary of the issue.
    3. Return ONLY a JSON object in this format:
    {{"department": "Department Name", "summary": "The summary text"}}
    """

    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        # FIX: Removed the double braces here. 
        # This is a standard dictionary argument.
        response_format={"type": "json_object"},
    )

    return json.loads(chat_completion.choices[0].message.content)