// Learnmentor Backend Application
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import authRoutes from "./modules/auth/auth.routes";
import profileRoutes from "./modules/profile/profile.routes";
import adminRoutes from "./modules/admin/admin.routes";
import tutorRoutes from "./modules/tutor/tutor.routes";
import chatRoutes from "./modules/chat/chat.routes";
import reviewRoutes from "./modules/review/review.routes";
import notificationRoutes from "./modules/notification/notification.routes";
import bookingRoutes from "./modules/booking/booking.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import transactionRoutes from "./modules/transaction/transaction.routes";
import studyRoutes from "./modules/study/study.routes";


const app = express();

// Security Middlewares
app.use(helmet()); // Adds security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'], // Allow common frontend ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Swagger setup
/*
const swaggerOptions: swaggerJsdoc.Options = {
    // ... items ...
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
*/

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/transactions", transactionRoutes); // Updated import to use a dedicated prefix if desired, or keep /api if general
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/study", studyRoutes);

// Health check
app.get("/", (_req, res) => {
  res.send('<h1>🚀 LearnMentor API Server</h1><p><a href="/swagger">📚 API Documentation</a></p>');
});

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString()
  });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;
