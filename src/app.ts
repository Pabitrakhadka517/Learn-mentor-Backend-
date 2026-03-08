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
const env = process.env as Record<string, string | undefined>;

// Security Middlewares
app.use(helmet()); // Adds security headers
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow any localhost origin (Flutter web uses random ports)
    if (env.NODE_ENV !== 'production') {
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
    }
    
    // Check against allowed origins from env
    const allowedOrigins = env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(',').map((o: string) => o.trim())
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
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
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LearnMentor API",
      version: "1.0.0",
      description: "API documentation for LearnMentor platform",
    },
    servers: [
      {
        url: env.NODE_ENV === "production"
          ? env.API_URL || "http://localhost:5000"
          : `http://localhost:${env.PORT || 5000}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/modules/**/*.routes.ts"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/transactions", transactionRoutes);
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
