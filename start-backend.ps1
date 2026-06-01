# Start AI Tutor backend (run from project root)
Set-Location "$PSScriptRoot\backend"
$env:PYTHONIOENCODING = "utf-8"
& ".\venv\Scripts\python.exe" -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
