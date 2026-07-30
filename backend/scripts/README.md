# Test script: auth + consultation

This script automates a simple end-to-end flow against the local Medikit API:

- Register a test user (or login if it already exists)
- Fetch the list of doctors
- Create an appointment for the first doctor
- List appointments for the test user

Location: [backend/scripts/test_auth_consult.ps1](backend/scripts/test_auth_consult.ps1)

Usage (Windows PowerShell):

```powershell
cd backend
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test_auth_consult.ps1
```

Environment and safety:
- The script currently uses hardcoded test credentials (autotest+ci@example.com / password123). These are intended for local/dev use only.
- Recommended: instead of committing credentials, set `TEST_EMAIL` and `TEST_PASSWORD` environment variables and edit the script to read from them.
- The script does not modify production data, but it does create a user and appointment in the configured database.

Notes for maintainers:
- The script is useful for quick manual smoke tests and CI sanity checks.
- If you prefer not to keep credentials in repo history, consider converting the script to read secrets from the environment or an encrypted secrets store.

License: none — dev-only helper
