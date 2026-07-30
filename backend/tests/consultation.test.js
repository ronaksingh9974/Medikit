import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'

process.env.JWT_ACCESS_SECRET = 'test-access-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
process.env.JWT_ACCESS_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '1h'

const { default: app } = await import('../app.js')
const { connectDatabase, disconnectDatabase } = await import('../config/database.js')

let mongo
const register = (email = 'patient@example.com') => request(app).post('/api/auth/register').send({ name: 'Test User', email, password: 'password123' })
const authHeader = (token) => ({ Authorization: `Bearer ${token}` })

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await connectDatabase(mongo.getUri())
})

afterEach(async () => {
  await mongoose.connection.db.dropDatabase()
})

afterAll(async () => {
  await disconnectDatabase()
  await mongo.stop()
})

test('returns doctors and creates an appointment for the authenticated user', async () => {
  const registered = await register('patient@example.com').expect(201)
  const doctorsResponse = await request(app)
    .get('/api/consultations/doctors')
    .set(authHeader(registered.body.accessToken))
    .expect(200)

  expect(doctorsResponse.body.doctors.length).toBeGreaterThan(0)

  const appointmentResponse = await request(app)
    .post('/api/consultations/appointments')
    .set(authHeader(registered.body.accessToken))
    .send({
      doctorId: doctorsResponse.body.doctors[0]._id,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      reason: 'Need guidance for persistent fever',
      consultationType: 'video'
    })
    .expect(201)

  expect(appointmentResponse.body.appointment.patientId).toBe(registered.body.user.id)
  expect(appointmentResponse.body.appointment.status).toBe('pending')
})

test('returns appointment history for the authenticated user', async () => {
  const registered = await register('history@example.com').expect(201)
  const doctorsResponse = await request(app)
    .get('/api/consultations/doctors')
    .set(authHeader(registered.body.accessToken))
    .expect(200)

  await request(app)
    .post('/api/consultations/appointments')
    .set(authHeader(registered.body.accessToken))
    .send({
      doctorId: doctorsResponse.body.doctors[0]._id,
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      reason: 'Follow-up question',
      consultationType: 'audio'
    })
    .expect(201)

  const historyResponse = await request(app)
    .get('/api/consultations/appointments')
    .set(authHeader(registered.body.accessToken))
    .expect(200)

  expect(historyResponse.body.appointments).toHaveLength(1)
  expect(historyResponse.body.appointments[0].reason).toBe('Follow-up question')
})
