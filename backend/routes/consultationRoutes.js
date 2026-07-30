import { Router } from 'express'
import { body } from 'express-validator'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createAppointment, listAppointments, listDoctors, updateAppointmentStatus } from '../controllers/consultationController.js'

const router = Router()

router.use(requireAuth)

router.get('/doctors', listDoctors)
router.get('/appointments', listAppointments)
router.post('/appointments', [body('doctorId').isMongoId().withMessage('A valid doctorId is required.'), body('scheduledAt').isISO8601().withMessage('A valid appointment time is required.'), body('reason').trim().isLength({ min: 1, max: 500 }).withMessage('A consultation reason is required.'), body('consultationType').optional().isIn(['video', 'audio', 'chat'])], validate, createAppointment)
router.patch('/appointments/:id/status', body('status').isIn(['pending', 'confirmed', 'active', 'completed', 'cancelled']).withMessage('A valid status is required.'), validate, updateAppointmentStatus)

export default router
