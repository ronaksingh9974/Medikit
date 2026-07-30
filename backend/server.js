import dns from 'dns'
import app from './app.js'
import { connectDatabase } from './config/database.js'
import { env, validateEnvironment } from './config/env.js'
import Doctor from './models/Doctor.js'

validateEnvironment()

const dnsServers = process.env.NODE_DNS_SERVERS ? process.env.NODE_DNS_SERVERS.split(',').map((server) => server.trim()) : ['1.1.1.1', '8.8.8.8']
dns.setServers(dnsServers)
console.log('Using DNS servers:', dns.getServers())
console.log("MongoDB URI loaded successfully");

connectDatabase(env.mongoUri)
  .then(async () => {
    const doctorCount = await Doctor.countDocuments()
    if (doctorCount === 0) {
      await Doctor.insertMany([
        { name: 'Dr. Asha Mehta', specialty: 'General Physician', experienceYears: 12, consultationFee: 499, rating: 4.9, bio: 'Specializes in primary care and preventive health guidance.', availableNext: 'Today · 6:00 PM', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80' },
        { name: 'Dr. Ravi Shah', specialty: 'Cardiology', experienceYears: 15, consultationFee: 699, rating: 4.8, bio: 'Cardiology expert focused on heart health and lifestyle guidance.', availableNext: 'Tomorrow · 10:30 AM', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80' }
      ])
    }
    app.listen(env.port, () => console.log(`Medkit API listening on port ${env.port}`))
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })