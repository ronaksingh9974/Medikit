import mongoose from 'mongoose'

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  specialty: { type: String, required: true, trim: true, maxlength: 120 },
  experienceYears: { type: Number, min: 0, default: 0 },
  consultationFee: { type: Number, min: 0, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 4.8 },
  bio: { type: String, trim: true, maxlength: 500, default: '' },
  availableNext: { type: String, trim: true, maxlength: 80, default: 'Today' },
  image: { type: String, trim: true, maxlength: 1000, default: '' }
}, { timestamps: true })

export default mongoose.model('Doctor', doctorSchema)
