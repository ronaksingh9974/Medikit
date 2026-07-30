import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCalendar, FiSend } from 'react-icons/fi'
import ConsultationDoctorCard from '../components/ConsultationDoctorCard'
import { Button, Card, Input, Modal } from '../components/Ui'
import { createAppointment, fetchAppointments, fetchDoctors, updateAppointmentStatus } from '../services/consultationService'

const initialMessages = [
  { id: 1, from: 'bot', text: 'Tell us what is bothering you and we will help you find a doctor for a one-to-one consultation.' }
]

export default function Consultation() {
  const [messages, setMessages] = useState(initialMessages)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [bookingError, setBookingError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [selectedSpecialty, setSelectedSpecialty] = useState('All')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingDoctor, setBookingDoctor] = useState(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingSlot, setBookingSlot] = useState('')
  const [bookingReason, setBookingReason] = useState('')

  const addMessage = (message) => setMessages((current) => [...current, message])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setIsAuthenticated(Boolean(token))
    if (!token) return
    Promise.all([fetchDoctors(token), fetchAppointments(token)])
      .then(([doctorResponse, appointmentResponse]) => {
        setDoctors(doctorResponse.doctors || [])
        setAppointments(appointmentResponse.appointments || [])
      })
      .catch(() => {
        setDoctors([])
        setAppointments([])
      })
  }, [])

  const handleSend = async (event) => {
    event.preventDefault()
    const trimmed = question.trim()
    if (!trimmed) return

    const userMessage = { id: Date.now(), from: 'user', text: trimmed }
    addMessage(userMessage)
    setQuestion('')
    setLoading(true)

    const simulatedResponse = generateBotResponse(trimmed)
    await new Promise((resolve) => setTimeout(resolve, 800))
    addMessage({ id: Date.now() + 1, from: 'bot', text: simulatedResponse })
    setLoading(false)
  }

  const specialties = ['All', ...new Set(doctors.map((doctor) => doctor.specialty))]

  const getUpcomingDates = () => {
    const dates = []
    const today = new Date()
    for (let index = 0; index < 5; index += 1) {
      const date = new Date(today)
      date.setDate(today.getDate() + index)
      dates.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        label: date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
      })
    }
    return dates
  }

  const getSlotOptions = (doctor) => {
    if (doctor?.availabilitySlots?.length) {
      return doctor.availabilitySlots.map((slot) => ({
        value: slot.time,
        label: slot.label,
        display: slot.time
      }))
    }

    return [
      { value: '09:00 AM', label: 'Morning', display: '09:00 AM' },
      { value: '12:00 PM', label: 'Midday', display: '12:00 PM' },
      { value: '06:00 PM', label: 'Evening', display: '06:00 PM' }
    ]
  }

  const openBookingModal = (doctor) => {
    const upcomingDates = getUpcomingDates()
    const slotOptions = getSlotOptions(doctor)
    setSelectedDoctor(doctor)
    setBookingDoctor(doctor)
    setBookingReason('')
    setBookingDate(upcomingDates[0]?.value || '')
    setBookingSlot(slotOptions[0]?.value || '')
    setBookingError('')
    setBookingSuccess('')
    setShowBookingModal(true)
  }

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor)
    openBookingModal(doctor)
  }

  const closeBookingModal = () => {
    setShowBookingModal(false)
    setBookingDoctor(null)
  }

  useEffect(() => {
    if (!showSuccessToast) return
    const timer = window.setTimeout(() => setShowSuccessToast(false), 3000)
    return () => window.clearTimeout(timer)
  }, [showSuccessToast])

  const handleBook = async (event) => {
    event.preventDefault()
    if (!bookingDoctor) {
      setBookingError('Select a doctor first.')
      return
    }
    if (!bookingReason.trim() || !bookingDate || !bookingSlot) {
      setBookingError('Please add a reason and select a date and time slot.')
      return
    }

    const token = localStorage.getItem('accessToken')
    if (!token) {
      setBookingError('Please log in to book a consultation.')
      return
    }

    try {
      setBookingError('')
      const [year, month, day] = bookingDate.split('-').map(Number)
      const [hours, minutes] = bookingSlot.split(':').map(Number)
      const scheduledAt = new Date(year, month - 1, day, hours, minutes).toISOString()

      const response = await createAppointment(token, {
        doctorId: bookingDoctor._id,
        scheduledAt,
        reason: bookingReason,
        consultationType: 'video'
      })
      setBookingSuccess(`Appointment created with ${bookingDoctor.name} for ${new Date(response.appointment.scheduledAt).toLocaleString()}.`)
      setShowSuccessToast(true)
      const refreshedAppointments = await fetchAppointments(token)
      setAppointments(refreshedAppointments.appointments || [])
      setBookingReason('')
      setBookingDate('')
      setBookingSlot('')
      setSelectedDoctor(bookingDoctor)
    } catch (error) {
      setBookingError(error.message)
    }
  }

  const handleStatusChange = async (appointmentId, status) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      await updateAppointmentStatus(token, appointmentId, status)
      const refreshedAppointments = await fetchAppointments(token)
      setAppointments(refreshedAppointments.appointments || [])
    } catch (error) {
      setBookingError(error.message)
    }
  }

  const getMedicineSuggestions = (text) => {
    if (text.includes('headache')) return ['Paracetamol', 'Ibuprofen', 'Aspirin (if not contraindicated)']
    if (text.includes('fever')) return ['Paracetamol', 'Ibuprofen', 'Cold compress']
    if (text.includes('cough')) return ['Cough syrup with dextromethorphan', 'Honey and warm liquids']
    if (text.includes('cold') || text.includes('flu')) return ['Vitamin C supplements', 'Zinc syrup', 'Steam inhalation']
    if (text.includes('stomach') || text.includes('acidity')) return ['Antacids', 'Proton pump inhibitor like omeprazole']
    return []
  }

  const generateBotResponse = (input) => {
    const text = input.toLowerCase()
    const suggestions = getMedicineSuggestions(text)

    if (text.includes('headache') || text.includes('fever')) {
      const base = 'It sounds like you may need a general physician or family medicine consult. We can help you book a one-to-one session for a more detailed check.'
      return suggestions.length ? `${base} Useful medicines for this condition may include: ${suggestions.join(', ')}.` : base
    }
    if (text.includes('cough')) {
      return 'A respiratory-focused consultation could be the best next step. We can help you book a doctor for a focused review of symptoms and medication guidance.'
    }
    if (text.includes('cold') || text.includes('flu')) {
      return 'A doctor consultation can help you manage symptoms carefully and avoid overusing medicines. We can help you find a suitable specialist quickly.'
    }
    if (text.includes('stomach') || text.includes('acidity')) {
      return 'A general physician or gastroenterology consult may help with persistent symptoms. We can guide you to the right doctor.'
    }
    if (text.includes('medicine') || text.includes('dose')) {
      return 'Please share the medicine name and your current concern. We can help you choose a doctor and prepare the right consultation details.'
    }
    return 'Thanks for sharing. We can help you find a doctor and schedule a one-to-one consultation based on your symptoms.'
  }

  if (!isAuthenticated) {
    return (
      <div className="page consultation-page">
        <div className="crumb">Home › AI Consultation</div>
        <div className="page-heading"><h1>1:1 Doctor Consultation</h1><p>Find a specialist, describe your concern, and book a consultation that fits your schedule.</p></div>
        <Card className="consultation-login-card">
          <h2>Please log in to view doctor availability and book consultations.</h2>
          <p>Sign in to access one-to-one doctor consultations, manage your appointments, and see personalized availability.</p>
          <div className="consultation-login-actions">
            <Link to="/login" state={{ from: '/consultation' }}><Button>Login</Button></Link>
            <Link to="/register" state={{ from: '/consultation' }}><Button variant="outline">Register</Button></Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="page consultation-page">
      <div className="crumb">Home › AI Consultation</div>
      <div className="page-heading"><h1>1:1 Doctor Consultation</h1><p>Find a specialist, describe your concern, and book a consultation that fits your schedule.</p></div>
      <Card className="consultation-card">
        <div className="chat-list">
          {messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.from}`}>
              <div className="chat-bubble"><p>{message.text}</p></div>
            </div>
          ))}
        </div>
        <form className="chat-form" onSubmit={handleSend}>
          <Input label="Describe your concern" placeholder="Type your symptoms or question..." value={question} onChange={(e) => setQuestion(e.target.value)} />
          <Button type="submit" disabled={loading}>{loading ? 'Thinking...' : <><FiSend /> Ask</>}</Button>
        </form>
      </Card>

      {showSuccessToast && bookingSuccess && (
        <div className="consultation-toast">{bookingSuccess}</div>
      )}

      <Card className="consultation-availability-card">
        <div className="consultation-availability-header">
          <h2>Today's availability</h2>
          <span>{selectedDoctor ? selectedDoctor.name : 'Select a doctor'}</span>
        </div>
        {selectedDoctor ? (
          <div className="consultation-availability-body">
            <div className="consultation-availability-badge">
              <strong>{selectedDoctor.availableNext}</strong>
              <p>{selectedDoctor.specialty}</p>
            </div>
            <div className="consultation-availability-slots">
              {(selectedDoctor.availabilitySlots || []).slice(0, 3).map((slot) => (
                <div key={slot.id} className="consultation-availability-slot">
                  <span>{slot.label}</span>
                  <strong>{slot.time}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="consultation-empty-state">Choose a doctor to see the next open consultation windows.</p>
        )}
      </Card>

      <div className="consultation-doctors-section">
        <div className="consultation-doctors-header">
          <h2>Available doctors</h2>
          <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)}>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>
        <div className="consultation-doctors-grid">
          {doctors
            .filter((doctor) => selectedSpecialty === 'All' || doctor.specialty === selectedSpecialty)
            .map((doctor) => (
              <ConsultationDoctorCard key={doctor._id} doctor={doctor} isSelected={selectedDoctor?._id === doctor._id} onSelect={() => handleDoctorSelect(doctor)} />
            ))}
        </div>
      </div>

      <div className="consultation-history-section">
        <h2>Your appointment history</h2>
        {appointments.length ? (
          <div className="consultation-history-list">
            {appointments.map((appointment) => (
              <Card key={appointment._id} className="consultation-history-card">
                <div className="consultation-history-card-top">
                  <strong>{appointment.doctorId?.name || 'Doctor'}</strong>
                  <span>{appointment.status}</span>
                </div>
                <p>{appointment.reason}</p>
                <small>{new Date(appointment.scheduledAt).toLocaleString()}</small>
                <div className="consultation-status-actions">
                  {['pending', 'confirmed', 'active', 'completed', 'cancelled'].map((status) => (
                    <button key={status} className="consultation-status-btn" type="button" onClick={() => handleStatusChange(appointment._id, status)}>
                      {status}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="consultation-empty-state">No appointments yet. Book your first consultation to see it here.</p>
        )}
      </div>

      {showBookingModal && bookingDoctor && (
        <Modal title={`Book with ${bookingDoctor.name}`} onClose={closeBookingModal}>
          <form className="consultation-booking-form" onSubmit={handleBook}>
            <div className="consultation-picker-group">
              <label className="consultation-picker-label">Pick a date</label>
              <div className="consultation-date-grid">
                {getUpcomingDates().map((dateOption) => (
                  <button key={dateOption.value} type="button" className={`consultation-date-pill ${bookingDate === dateOption.value ? 'active' : ''}`} onClick={() => setBookingDate(dateOption.value)}>
                    {dateOption.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="consultation-picker-group">
              <label className="consultation-picker-label">Select a time slot</label>
              <div className="consultation-slot-grid">
                {getSlotOptions(bookingDoctor).map((slotOption) => (
                  <button key={slotOption.value} type="button" className={`consultation-slot-pill ${bookingSlot === slotOption.value ? 'active' : ''}`} onClick={() => setBookingSlot(slotOption.value)}>
                    {slotOption.label} · {slotOption.display}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Reason for consultation" placeholder="Example: persistent fever for 2 days" value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} />
            {bookingError && <p className="field-error">{bookingError}</p>}
            {bookingSuccess && <p className="field-success">{bookingSuccess}</p>}
            <div className="consultation-modal-actions">
              <Button type="button" variant="outline" onClick={closeBookingModal}>Cancel</Button>
              <Button type="submit">Book consultation</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
