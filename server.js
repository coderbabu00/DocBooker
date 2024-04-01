import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";
import connectDB from "./middlewares/db.js";
import helmet from "helmet";
import morgan from "morgan";

//cloudinary Config
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });

const app = express();

dotenv.config();

app.get("/", (req, res) => {
    res.send("Hello World")
})

// Middlewares
app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use(helmet())
app.use(morgan("common"))

// Connect DB
connectDB();

// Routes
import userRoutes from "./routes/userRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
app.use("/api/users", userRoutes);
app.use("/api/apts", appointmentRoutes);

app.listen(process.env.PORT, () => console.log(`Server is running on ${process.env.PORT}`))

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  });