const API_BASE = '/api/consultations'

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'Request failed.')
  return body
}

export async function fetchDoctors(token) {
  return request(`${API_BASE}/doctors`, { headers: { Authorization: `Bearer ${token}` } })
}

export async function createAppointment(token, payload) {
  return request(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
}

export async function fetchAppointments(token) {
  return request(`${API_BASE}/appointments`, { headers: { Authorization: `Bearer ${token}` } })
}

export async function updateAppointmentStatus(token, appointmentId, status) {
  return request(`${API_BASE}/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status })
  })
}
