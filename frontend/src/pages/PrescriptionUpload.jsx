import { useState, useRef } from 'react'

// ---------------------------------------------------------------------
// This points directly at the Flask Scanner service for now — that's
// correct for local development while you're testing this in isolation.
//
// Once the Express proxy route (POST /api/prescriptions/scan) exists on
// the MediKit backend, change this one line to '/api/prescriptions/scan'
// and nothing else in this file needs to change. That's the whole point
// of keeping Scanner decoupled: this component doesn't need to know or
// care whether it's talking to Flask directly or through the Node proxy.
//
// Better than hardcoding it: put it in frontend/.env.local as
//   VITE_SCANNER_API_URL=http://127.0.0.1:5000/upload
// so it's a one-line env change, not a code change, when you deploy.
// ---------------------------------------------------------------------
const SCANNER_API_URL =
  import.meta.env.VITE_SCANNER_API_URL || 'http://127.0.0.1:5000/upload'

export default function PrescriptionUpload({ addToast }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [status, setStatus] = useState('idle') // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setResult(null)
    setStatus('idle')
    setErrorMessage('')
    setPreviewUrl(URL.createObjectURL(selected))
  }

  async function handleUpload() {
    if (!file) return

    setStatus('uploading')
    setErrorMessage('')

    const formData = new FormData()
    // "prescription" must match request.files["prescription"] in app.py
    formData.append('prescription', file)

    try {
      const response = await fetch(SCANNER_API_URL, {
        method: 'POST',
        body: formData,
      })

      // The Flask service returns JSON with an HTTP error status on
      // failure (400/500), not just a network failure — so check
      // response.ok in addition to catching network-level errors.
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Scan failed. Please try again.')
      }

      setResult(data)
      setStatus('success')
      addToast?.(`Found ${data.medicine_count} medicine(s) in your prescription.`)
    } catch (err) {
      // A network-level failure (server down, wrong URL, CORS block)
      // lands here as "Failed to fetch" — the fetch never got a response
      // at all. Anything the server actively responded with (a 400/500
      // with a JSON message) is caught above instead.
      const isNetworkFailure = err instanceof TypeError
      setErrorMessage(
        isNetworkFailure
          ? "Could not reach the scanner service. Make sure it's running and try again."
          : err.message
      )
      setStatus('error')
    }
  }

  function handleReset() {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setStatus('idle')
    setErrorMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="prescription-upload">
      <h2>Upload Prescription</h2>
      <p className="prescription-upload__hint">
        Upload a clear photo of your prescription and we'll detect the medicines automatically.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        disabled={status === 'uploading'}
      />

      {previewUrl && (
        <div className="prescription-upload__preview">
          <img src={previewUrl} alt="Prescription preview" />
        </div>
      )}

      <div className="prescription-upload__actions">
        <button
          onClick={handleUpload}
          disabled={!file || status === 'uploading'}
        >
          {status === 'uploading' ? 'Scanning…' : 'Scan Prescription'}
        </button>
        {(file || result) && (
          <button onClick={handleReset} disabled={status === 'uploading'}>
            Reset
          </button>
        )}
      </div>

      {status === 'error' && (
        <p className="prescription-upload__error" role="alert">
          {errorMessage}
        </p>
      )}

      {status === 'success' && result && (
        <div className="prescription-upload__results">
          <h3>
            {result.medicine_count > 0
              ? `Detected ${result.medicine_count} medicine(s)`
              : 'No known medicines detected'}
          </h3>

          {result.medicine_count === 0 && (
            <p>
              We couldn't confidently match anything in this image to our medicine
              database. Try a clearer or better-lit photo.
            </p>
          )}

          <ul className="prescription-upload__medicine-list">
            {result.medicines.map((med) => (
              <li key={med.medicine} className="prescription-upload__medicine-card">
                <strong>{med.medicine}</strong>
                <div>Composition: {med.composition}</div>
                <div>Usage: {med.usage}</div>
                <div>Dosage: {med.dosage}</div>
                <div>Alternative: {med.alternative}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}