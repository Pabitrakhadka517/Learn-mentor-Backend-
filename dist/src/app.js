"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const profile_routes_1 = __importDefault(require("./modules/profile/profile.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const tutor_routes_1 = __importDefault(require("./modules/tutor/tutor.routes"));
const chat_routes_1 = __importDefault(require("./modules/chat/chat.routes"));
const review_routes_1 = __importDefault(require("./modules/review/review.routes"));
const notification_routes_1 = __importDefault(require("./modules/notification/notification.routes"));
const booking_routes_1 = __importDefault(require("./modules/booking/booking.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const transaction_routes_1 = __importDefault(require("./modules/transaction/transaction.routes"));
const study_routes_1 = __importDefault(require("./modules/study/study.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
    console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/profile", profile_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/tutors", tutor_routes_1.default);
app.use("/api/chats", chat_routes_1.default);
app.use("/api/transactions", transaction_routes_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/bookings", booking_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/study", study_routes_1.default);
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
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map