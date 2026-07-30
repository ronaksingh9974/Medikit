import Doctor from '../models/Doctor.js'
import ConsultationAppointment from '../models/ConsultationAppointment.js'

function buildAvailabilitySlots(doctor) {
  const base = [
    { label: 'Morning', time: '09:00 AM' },
    { label: 'Midday', time: '12:00 PM' },
    { label: 'Evening', time: '06:00 PM' }
  ]

  return base.map((slot, index) => ({
    id: `${doctor._id}-${index}`,
    doctorId: doctor._id,
    label: slot.label,
    time: slot.time,
    available: true
  }))
}

async function ensureSeedDoctors() {
  const doctorCount = await Doctor.countDocuments()
  if (doctorCount > 0) return

  await Doctor.insertMany([
    { name: 'Dr. Asha Mehta', specialty: 'General Physician', experienceYears: 12, consultationFee: 499, rating: 4.9, bio: 'Specializes in primary care and preventive health guidance.', availableNext: 'Today · 6:00 PM', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80' },
    { name: 'Dr. Ravi Shah', specialty: 'Cardiology', experienceYears: 15, consultationFee: 699, rating: 4.8, bio: 'Cardiology expert focused on heart health and lifestyle guidance.', availableNext: 'Tomorrow · 10:30 AM', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80' }
  ])
}

export async function listDoctors(req, res, next) {
  try {
    await ensureSeedDoctors()
    const query = {}
    if (req.query.specialty) query.specialty = new RegExp(req.query.specialty, 'i')

    const doctors = await Doctor.find(query).sort({ rating: -1, experienceYears: -1 })
    const doctorsWithSlots = doctors.map((doctor) => ({
      ...doctor.toObject(),
      availabilitySlots: buildAvailabilitySlots(doctor)
    }))
    res.json({ doctors: doctorsWithSlots })
  } catch (error) {
    next(error)
  }
}

export async function listAppointments(req, res, next) {
  try {
    const appointments = await ConsultationAppointment.find({ patientId: req.user._id }).populate('doctorId').sort({ scheduledAt: 1 })
    res.json({ appointments })
  } catch (error) {
    next(error)
  }
}

export async function createAppointment(req, res, next) {
  try {
    const { doctorId, scheduledAt, reason, consultationType } = req.body

    const doctor = await Doctor.findById(doctorId)
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    const appointment = await ConsultationAppointment.create({
      patientId: req.user._id,
      doctorId,
      scheduledAt,
      reason,
      consultationType,
      status: 'pending'
    })

    res.status(201).json({ appointment })
  } catch (error) {
    next(error)
  }
}

export async function updateAppointmentStatus(req, res, next) {
  try {
    const appointment = await ConsultationAppointment.findOne({ _id: req.params.id, patientId: req.user._id })
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' })

    const { status } = req.body
    if (!['pending', 'confirmed', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(422).json({ message: 'Invalid appointment status.' })
    }

    appointment.status = status
    await appointment.save()
    res.json({ appointment })
  } catch (error) {
    next(error)
  }
}
