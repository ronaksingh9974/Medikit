<<<<<<< HEAD
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
=======
import { useState } from 'react'
import { FiUpload } from 'react-icons/fi'
import { Button, Card, Input } from '../components/Ui'

const defaultResult = null

export default function PrescriptionUpload() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('')
  const [fileText, setFileText] = useState('')
  const [result, setResult] = useState(defaultResult)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const readTextFile = (file) => new Promise((resolve, reject) => {
    if (!file) return resolve('')
    if (file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name)) {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result || '')
      reader.onerror = () => reject(new Error('Unable to read text file.'))
      reader.readAsText(file)
    } else {
      resolve('')
    }
  })

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setFileName('')
      setFileType('')
      setFileText('')
      return
    }
    setSelectedFile(file)
    setFileName(file.name)
    setFileType(file.type || file.name.split('.').pop())
    try {
      const text = await readTextFile(file)
      setFileText(text)
    } catch (err) {
      setFileText('')
    }
    setResult(defaultResult)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedFile) {
      setError('Please choose an image or document to upload.')
      return
    }
    setLoading(true)
    setError('')
    setResult(defaultResult)
    try {
      const response = await fetch('/api/prescriptions/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileType, fileText })
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Upload failed.')
      setResult(body)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page upload-prescription-page">
      <div className="crumb">Home › Upload Prescription</div>
      <h1>Upload your prescription</h1>
      <p>Choose a medicine image or document and Medkit will scan the prescription to suggest the medicine name and its uses. Follow your doctor’s schedule for dosage.</p>

      <Card className="upload-card">
        <form onSubmit={handleSubmit}>
          <label className="field file-field">
            <span>Select image or document</span>
            <input type="file" accept="image/*,.pdf,.txt,.md" onChange={handleFileChange} />
            <small>{selectedFile ? selectedFile.name : 'PNG, JPG, PDF, or text file accepted'}</small>
          </label>
          <label className="field">
            <span>Detected medicine text (optional)</span>
            <textarea value={fileText} onChange={(e) => setFileText(e.target.value)} placeholder="Paste medicine name or prescription text here" rows="4" />
          </label>
          {error && <p className="field-error">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'Scanning...' : <><FiUpload /> Upload and scan</>}</Button>
        </form>
      </Card>

      {result && (
        <Card className="prescription-result">
          <h2>Prescription summary</h2>
          <p><strong>Medicine name:</strong> {result.medicineName}</p>
          <p><strong>Uses:</strong> {result.uses}</p>
          <p><strong>Advice:</strong> {result.instructions}</p>
        </Card>
      )}
    </div>
  )
}
>>>>>>> parent of ac8c6aab (bug add hahahhaa)
