$ErrorActionPreference='Stop'
$email='autotest+ci@example.com'
$pwd='password123'
$body = @{ name='Auto Test'; email=$email; password=$pwd } | ConvertTo-Json
try {
  $reg = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method Post -Body $body -ContentType 'application/json'
  Write-Output 'REGISTERED'
  $resp = $reg
} catch {
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode.Value__ -eq 409) {
    Write-Output 'ALREADY_EXISTS'
    $loginBody = @{ email=$email; password=$pwd } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
  } else {
    Write-Error $_
    exit 1
  }
}
$token = $resp.accessToken
Write-Output "ACCESS:$token"
$headers = @{ Authorization = "Bearer $token" }
$doctors = Invoke-RestMethod -Uri 'http://localhost:5000/api/consultations/doctors' -Headers $headers -Method Get
Write-Output 'DOCTORS:'
$doctors | ConvertTo-Json -Depth 5
$docId = $doctors.doctors[0]._id
$scheduled = (Get-Date).AddHours(2).ToString('s') + 'Z'
Write-Output "Scheduling with doctor $docId at $scheduled"
$apptBody = @{ doctorId = $docId; scheduledAt = $scheduled; reason = 'Automated test'; consultationType = 'video' } | ConvertTo-Json
$appt = Invoke-RestMethod -Uri 'http://localhost:5000/api/consultations/appointments' -Headers $headers -Method Post -Body $apptBody -ContentType 'application/json'
Write-Output 'APPOINTMENT:'
$appt | ConvertTo-Json -Depth 5
$appts = Invoke-RestMethod -Uri 'http://localhost:5000/api/consultations/appointments' -Headers $headers -Method Get
Write-Output 'APPOINTMENTS:'
$appts | ConvertTo-Json -Depth 5
