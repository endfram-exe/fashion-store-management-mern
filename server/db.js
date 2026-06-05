import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fashionhub";

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[db] Connected to ${uri}`);
    return true;
  } catch (error) {
    console.warn(`[db] MongoDB unavailable: ${error.message}`);
    console.warn("[db] Using in-memory inventory store for this session.");
    return false;
  }
}
