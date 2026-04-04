import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import events from "./routes/events.js";
import auth from "./routes/auth.js";
import profiles from "./routes/profiles.js";
import admin from "./routes/admin.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/events", events);
app.use("/auth", auth);
app.use("/profiles", profiles);
app.use("/admin", admin);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
