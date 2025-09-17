
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectDB = async () => {
  try {
    const dbUrl = process.env.MONGOOSE_URL;
    if (!dbUrl) throw new Error("MONGOOSE_URL not found in .env");

    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("✅ MongoDB connected...");
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1); // stop server if DB fails
  }

  // Optional logging for connection events
  mongoose.connection.on("connected", () => {
    console.log("📡 Mongoose connected to DB");
  });
  mongoose.connection.on("error", (err) => {
    console.error("⚠️ Mongoose connection error:", err);
  });
  mongoose.connection.on("disconnected", () => {
    console.log("❌ Mongoose disconnected");
  });
};

