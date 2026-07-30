const API_BASE = '/api/auth'

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

export async function registerUser(payload) {
  return request(`${API_BASE}/register`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function loginUser(payload) {
  return request(`${API_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
