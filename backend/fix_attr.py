import sys

path = r"c:\Users\athid\OneDrive\Desktop\reactApp\MiniProject\Grievance-management\backend\core\department.py"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("request.user.employee", "request.user.employee_profile")
text = text.replace("hasattr(request.user, 'employee')", "hasattr(request.user, 'employee_profile')")

with open(path, "w", encoding="utf-8") as f:
    f.write(text)
print("Done fixing attributes!")
