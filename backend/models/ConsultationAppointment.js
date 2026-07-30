import mongoose from 'mongoose'

const consultationAppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  scheduledAt: { type: Date, required: true },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  consultationType: { type: String, enum: ['video', 'audio', 'chat'], default: 'video' },
  status: { type: String, enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String, trim: true, maxlength: 2000, default: '' }
}, { timestamps: true })

export default mongoose.model('ConsultationAppointment', consultationAppointmentSchema)
