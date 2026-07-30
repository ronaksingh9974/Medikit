import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

console.log(process.env.MONGODB_URI)

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected successfully!")
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })