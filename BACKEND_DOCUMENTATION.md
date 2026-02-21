# 🚀 LearnMentor Backend Documentation

This document serves as a comprehensive guide to the backend architecture, features, and implementation flows of the LearnMentor platform.

---

## 🏗 System Architecture

The backend is built using the **MERN Stack** logic (MongoDB, Express, Node.js) with **Strict TypeScript** for type safety.

- **Architecture**: Modular (Service-Repository-Controller pattern)
- **Database**: MongoDB (Mongoose with strict schemas)
- **Authentication**: JWT (Access + Refresh Tokens)
- **Real-Time**: Socket.io (Chat & Notifications)

---

## 📦 Modules & Features

### 1️⃣ Authentication & User Management
*Status: ✅ Complete*

- **Roles**: `STUDENT`, `TUTOR`, `ADMIN`
- **Features**:
    - Registration & Login (JWT)
    - Password Reset (Token-based)
    - Role-based Access Control (RBAC)
    - Profile Management (Avatar, Bio, Details)

### 2️⃣ Tutor Discovery
*Status: ✅ Complete*

- **Search & Filter**: Find tutors by subject, price, language, and availability.
- **Sorting**: By `averageRating`, `totalReviews`, `hourlyRate`.
- **Optimization**: Uses MongoDB Aggregation Pipelines for high performance.

### 3️⃣ Booking System & Session Lifecycle
*Status: ✅ Complete (MVP Ready)*

**Session Lifecycle:**
```
PENDING → ACCEPTED → PAID → COMPLETED
    ↓         ↓        ↓
REJECTED  CANCELLED  CANCELLED
```

**Flow:**
1. **Student** creates a booking request (`POST /api/bookings/book`).
    - *Status*: `PENDING`
    - *Notification*: Sent to Tutor.
    - **Double Booking Prevention**: Automatically checks for time conflicts
2. **Tutor** accepts or rejects (`PATCH /api/bookings/:id/status`).
    - *Status*: `ACCEPTED` / `REJECTED`
    - *Notification*: Sent to Student.
3. **Student** initiates payment for accepted bookings.
    - *Status*: `PAID`
    - *PaymentStatus*: `DONE`
4. **Tutor** marks session as complete (`PATCH /api/bookings/:id/complete`).
    - *Status*: `COMPLETED`
    - *Notification*: Sent to Student
5. **Either party** can cancel (`PATCH /api/bookings/:id/cancel`).
    - *Status*: `CANCELLED`
    - Cannot cancel if already `COMPLETED`

**Key Features:**
- ✅ Complete status lifecycle management
- ✅ Double booking prevention with time overlap detection
- ✅ Atomic status transitions
- ✅ Proper authorization (only tutor can complete, both can cancel)

**Key Models:** `Booking` linked to Student, Tutor, and Job/Transaction.

### 4️⃣ Payment System (eSewa Integration)
*Status: ✅ Complete*

**Features:**
- **Atomic Transactions**: Uses MongoDB Sessions to ensure data integrity.
- **Commission Logic**: Platform acts as escrow (10% commission, 90% to Tutor).
- **Wallet System**: Tutors have a `balance` field that updates automatically.

**Payment Flow:**
1. **Init**: `GET /jobs/transaction/:jobId` -> Validates job/booking & returns eSewa params.
2. **Verify**: `POST /jobs/transaction/:tId/pay` -> Called by frontend after eSewa success.
    - **Verify**: Checks amount matches DB (security).
    - **Atomic Update**:
        - Mark Transaction `done`.
        - Mark Booking/Job `paid`.
        - Add `netAmount` to Tutor's Wallet.
        - Trigger `PAYMENT_SUCCESS` notification.

### 5️⃣ Review & Rating System
*Status: ✅ Complete (MVP Ready)*

**Rules:**
- **Restriction**: Can only review if booking `status === 'COMPLETED'`.
- **One-per-booking**: strict unique constraint.

**Atomic Stats Update:**
- When a review is posted (`POST /api/reviews/:bookingId`), the system **atomically** recalculates the Tutor's `averageRating` and `totalReviews`.
- *Formula*: `((OldAvg * OldCount) + NewRating) / (OldCount + 1)`

### 6️⃣ Notification System
*Status: ✅ Complete*

**Features:**
- **Persistence**: Notifications stored in MongoDB (`Notification` model).
- **Real-Time**: Pushed via **Socket.io** (`new_notification` event).
- **Unread Counters**: API to fetch unread counts.

**Triggers:**
- `BOOKING_CREATED` -> Notify Tutor
- `BOOKING_UPDATED` -> Notify Student
- `PAYMENT_SUCCESS` -> Notify Tutor
- `NEW_REVIEW` -> Notify Tutor

### 7️⃣ Chat System
*Status: ✅ Complete*

- **Real-Time Messaging**: Socket.io rooms per chat.
- **Persistence**: Messages saved to DB.
- **Logic**: Only participants can join.

### 8️⃣ Dashboard Analytics
*Status: ✅ Complete (MVP Ready)*

#### Student Dashboard (`GET /api/dashboard/student`)
- ✅ Total money spent (sum of completed bookings)
- ✅ Total tutors worked with (distinct count)
- ✅ Total sessions completed
- ✅ Last 10 bookings
- ✅ Last 10 transactions

#### Tutor Dashboard (`GET /api/dashboard/tutor`)
- ✅ Total money earned (net after commission)
- ✅ Total students worked with (distinct count)
- ✅ Total sessions completed
- ✅ Average rating
- ✅ Last 10 bookings
- ✅ Last 10 transactions

#### Admin Dashboard (`GET /api/dashboard/admin`)
- ✅ Total users (all roles)
- ✅ Total students
- ✅ Total tutors
- ✅ Total bookings
- ✅ Total completed sessions
- ✅ Total revenue (gross)
- ✅ Total commission (platform profit)

**Implementation:**
- Uses MongoDB aggregation pipelines for efficiency
- Role-based access control (Admin-only for admin dashboard)
- Optimized with proper indexes

---

## 🗄 Database Schema Overview

| Model | Key Fields | Description |
|-------|------------|-------------|
| **User** | `role`, `balance`, `email` | Core user identity & wallet |
| **TutorProfile** | `averageRating`, `totalReviews` | Public tutor stats & bio |
| **Booking** | `status`, `paymentStatus`, `scheduledTime`, `endTime` | Tracks sessions with lifecycle |
| **Transaction** | `amount`, `commission`, `status` | Financial records |
| **Review** | `rating`, `comment` | Feedback linked to booking |
| **Notification** | `type`, `isRead`, `relatedId` | User alerts |
| **Chat/Message** | `content`, `attachments` | Communication history |

---

## 🛣 API Routes Summary

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`

### Booking
- `POST /api/bookings/book` - Create booking (Student)
- `GET /api/bookings` - Get my bookings (Student/Tutor)
- `PATCH /api/bookings/:bookingId/status` - Accept/Reject (Tutor)
- `PATCH /api/bookings/:id/complete` - Mark completed (Tutor) ✨ NEW
- `PATCH /api/bookings/:id/cancel` - Cancel booking (Student/Tutor) ✨ NEW

### Transaction (Payment)
- `GET /api/transactions/jobs/transaction/:jobId` (Init)
- `POST /api/transactions/jobs/transaction/:tId/pay` (Verify)
- `GET /api/transactions/sent` (Student History)
- `GET /api/transactions/received` (Tutor History)

### Review
- `POST /api/reviews/:bookingId` - Create review (COMPLETED only)
- `GET /api/reviews/tutor/:tutorId` - Get tutor reviews

### Notification
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`

### Tutor
- `GET /api/tutors` (Search/Filter)
- `GET /api/tutors/:id` (Details)

### Dashboard ✨ NEW
- `GET /api/dashboard/student` - Student stats (Student only)
- `GET /api/dashboard/tutor` - Tutor stats (Tutor only)
- `GET /api/dashboard/admin` - Admin stats (Admin only)

---

## 🔒 Security Measures

1. **Authentication**: All private routes protected by `authenticate`.
2. **Authorization**: Specific roles enforced via `authorizeRoles('TUTOR')`.
3. **Data Integrity**: Financials calculated on **Server-Side** (never trust frontend).
4. **Consistency**: Critical updates (Payments, Reviews) use **MongoDB Transactions**.
5. **Validation**: Zod & Manual checks for strict data compliance.
6. **Ownership Verification**: Users can only modify their own resources.
7. **ObjectId Validation**: All MongoDB IDs validated before queries.

---

## ⚡ Performance Optimizations

### Database Indexes

**Booking Model:**
```typescript
bookingSchema.index({ student: 1, status: 1 });
bookingSchema.index({ tutor: 1, status: 1 });
bookingSchema.index({ tutor: 1, scheduledTime: 1, endTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });
```

**Transaction Model:**
```typescript
transactionSchema.index({ sender: 1 });
transactionSchema.index({ receiver: 1 });
transactionSchema.index({ job: 1 });
transactionSchema.index({ transactionUuid: 1 });
```

**User Model:**
```typescript
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
```

---

## 🎯 MVP Status

### ✅ All MVP Features Complete

1. ✅ **Session Lifecycle Management**
   - Complete status flow (PENDING → ACCEPTED → PAID → COMPLETED)
   - Complete & Cancel endpoints
   - Proper authorization and validation

2. ✅ **Double Booking Prevention**
   - Time overlap detection
   - MongoDB query optimization
   - Proper error handling

3. ✅ **Student Dashboard**
   - All required metrics
   - Aggregation pipelines
   - Recent bookings & transactions

4. ✅ **Tutor Dashboard**
   - All required metrics
   - Net earnings calculation
   - Average rating display

5. ✅ **Admin Dashboard**
   - Platform-wide statistics
   - Revenue & commission tracking
   - Role-based access control

6. ✅ **Review System**
   - COMPLETED status validation
   - Atomic rating updates
   - One review per booking

---

## 📚 Documentation

- [MVP Features Complete Guide](./MVP_FEATURES_COMPLETE.md) - Detailed implementation guide
- [Authentication Documentation](./AUTH_DOCUMENTATION.md) - Auth system details
- [Tutor Discovery](./TUTOR_DISCOVERY.md) - Search & filter implementation
- [Chat System](./CHAT_SYSTEM.md) - Real-time messaging
- [Postman Collection](./MVP_Features_Testing.postman_collection.json) - API testing

---

## 🧪 Testing

Import the Postman collection `MVP_Features_Testing.postman_collection.json` for comprehensive API testing including:
- Session lifecycle flows
- Double booking prevention
- Dashboard APIs
- Review restrictions
- Role-based access control

---

*Documentation Generated by Antigravity Agent*
*Last Updated: 2026-02-18*
*Status: ✅ MVP Complete & Production Ready*

