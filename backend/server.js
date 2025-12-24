import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import librarianRoutes from "./routes/librarian.js";
import teacherRoutes from "./routes/teacher.js";
import wardenRoutes from "./routes/warden.js";
import paymentRoutes from "./routes/payment.js";
import gatepassRoutes from "./routes/gatepass.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// =========================
// MongoDB Atlas Connection
// =========================
// =========================
// MongoDB Atlas Connection
// =========================
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // Stop app if DB fails
  }
};

// =========================
// Routes
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/librarian", librarianRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/warden", wardenRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/gatepass", gatepassRoutes);

// =========================
// Health Check
// =========================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
  });
});

// =========================
// Start Server
// =========================
// Connect to DB first, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
