import mongoose from 'mongoose'

export async function connectDatabase(uri) {
  await mongoose.connect(uri)
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
}
