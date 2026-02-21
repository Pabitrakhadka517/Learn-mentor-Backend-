import express from "express";
console.log("Imported express");
import cors from "cors";
console.log("Imported cors");
import helmet from "helmet";
console.log("Imported helmet");
import authRoutes from "../src/modules/auth/auth.routes";
console.log("Imported authRoutes");
import profileRoutes from "../src/modules/profile/profile.routes";
console.log("Imported profileRoutes");
import adminRoutes from "../src/modules/admin/admin.routes";
console.log("Imported adminRoutes");
import tutorRoutes from "../src/modules/tutor/tutor.routes";
console.log("Imported tutorRoutes");
import chatRoutes from "../src/modules/chat/chat.routes";
console.log("Imported chatRoutes");
import reviewRoutes from "../src/modules/review/review.routes";
console.log("Imported reviewRoutes");
import notificationRoutes from "../src/modules/notification/notification.routes";
console.log("Imported notificationRoutes");
import bookingRoutes from "../src/modules/booking/booking.routes";
console.log("Imported bookingRoutes");
import dashboardRoutes from "../src/modules/dashboard/dashboard.routes";
console.log("Imported dashboardRoutes");
import transactionRoutes from "../src/modules/transaction/transaction.routes";
console.log("Imported transactionRoutes");
import studyRoutes from "../src/modules/study/study.routes";
console.log("Imported studyRoutes");

describe('Import Test', () => {
    it('should pass', () => {
        expect(true).toBe(true);
    });
});
