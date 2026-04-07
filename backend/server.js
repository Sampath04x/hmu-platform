import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import events from "./routes/events.js";
import auth from "./routes/auth.js";
import profiles from "./routes/profiles.js";
import admin from "./routes/admin.js";
import canteens from "./routes/canteens.js";
import posts from "./routes/posts.js";
import comments from "./routes/comments.js";
import classrooms from "./routes/classrooms.js";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

dotenv.config();
const app = express();

// Security Middlewares
app.use(helmet()); // Sets security HTTP headers
app.use(morgan("dev")); // HTTP request logger
app.use(cors({
  origin: ["http://localhost:3000", "https://intrst.in", /\.vercel\.app$/],
  credentials: true
}));
app.use(express.json());

// Health check for Render
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);
app.use("/events", events);
app.use("/auth", auth);
app.use("/profiles", profiles);
app.use("/admin", admin);
app.use("/canteens", canteens);
app.use("/posts", posts);
app.use("/comments", comments);
app.use("/classrooms", classrooms);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
