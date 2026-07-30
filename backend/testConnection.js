import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected successfully");
  } catch (err) {
    console.error("❌ Connection failed:");
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

test();