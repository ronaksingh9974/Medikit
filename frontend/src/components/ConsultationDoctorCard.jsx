import { Card } from './Ui'

export default function ConsultationDoctorCard({ doctor, onSelect, isSelected }) {
  return (
    <Card className={`consultation-doctor-card ${isSelected ? 'selected' : ''}`}>
      <div className="consultation-doctor-top">
        <div>
          <h3>{doctor.name}</h3>
          <p>{doctor.specialty}</p>
        </div>
        <span className="consultation-rating">★ {doctor.rating.toFixed(1)}</span>
      </div>
      <p className="consultation-bio">{doctor.bio}</p>
      <div className="consultation-meta">
        <span>{doctor.experienceYears} yrs exp</span>
        <span>₹{doctor.consultationFee}</span>
      </div>
      <div className="consultation-slot-list">
        {(doctor.availabilitySlots || []).slice(0, 3).map((slot) => (
          <span key={slot.id} className="consultation-slot-pill">{slot.label} · {slot.time}</span>
        ))}
      </div>
      <div className="consultation-meta-footer">
        <small>{doctor.availableNext}</small>
        <button className="button secondary" type="button" onClick={() => onSelect(doctor)}>
          {isSelected ? 'Selected' : 'Book now'}
        </button>
      </div>
    </Card>
  )
}
