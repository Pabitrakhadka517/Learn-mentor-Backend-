# 🎯 MVP Backend Features - Complete Implementation Guide

## Overview
This document provides a comprehensive guide to all MVP backend features for the LearnMentor tutoring platform, including API endpoints, validation rules, and usage examples.

---

## 🔄 1. Session Lifecycle Management

### Booking Status Flow

```
PENDING → ACCEPTED → PAID → COMPLETED
    ↓         ↓        ↓
REJECTED  CANCELLED  CANCELLED
```

### Status Definitions

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| `PENDING` | Initial state when student creates booking | System (auto) |
| `ACCEPTED` | Tutor has accepted the booking request | Tutor |
| `REJECTED` | Tutor has rejected the booking request | Tutor |
| `PAID` | Student has completed payment | System (after payment) |
| `COMPLETED` | Session finished successfully | Tutor |
| `CANCELLED` | Booking cancelled by either party | Student/Tutor |

### Payment Status

| Status | Description |
|--------|-------------|
| `UNPAID` | Payment not yet processed |
| `DONE` | Payment successfully completed |

### Business Rules

1. ✅ When tutor accepts → `status = ACCEPTED`
2. ✅ After successful payment → `status = PAID` & `paymentStatus = DONE`
3. ✅ Tutor can mark session completed → `status = COMPLETED`
4. ✅ Student or Tutor can cancel if not completed → `status = CANCELLED`
5. ✅ **Reviews only allowed if `status === COMPLETED`**

---

## 📋 2. API Endpoints

### 2.1 Complete Booking

**Endpoint:** `PATCH /api/bookings/:id/complete`

**Authorization:** Tutor only (must be the tutor of that booking)

**Request:**
```http
PATCH /api/bookings/507f1f77bcf86cd799439011/complete
Authorization: Bearer <tutor_jwt_token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Booking completed",
  "booking": {
    "_id": "507f1f77bcf86cd799439011",
    "student": "507f191e810c19729de860ea",
    "tutor": "507f191e810c19729de860eb",
    "status": "COMPLETED",
    "paymentStatus": "DONE",
    "scheduledTime": "2026-02-20T10:00:00.000Z",
    "endTime": "2026-02-20T11:00:00.000Z",
    "price": 500,
    "createdAt": "2026-02-18T01:00:00.000Z",
    "updatedAt": "2026-02-18T02:00:00.000Z"
  }
}
```

**Validation Rules:**
- ✅ Only the tutor of the booking can complete it
- ✅ Booking must be in `PAID` or `ACCEPTED` status
- ✅ Sends notification to student after completion

**Error Responses:**

```json
// 403 Forbidden - Not the tutor
{
  "message": "Only the tutor can complete this booking"
}

// 400 Bad Request - Invalid status
{
  "message": "Booking must be PAID or ACCEPTED to complete"
}

// 404 Not Found
{
  "message": "Booking not found"
}
```

---

### 2.2 Cancel Booking

**Endpoint:** `PATCH /api/bookings/:id/cancel`

**Authorization:** Student or Tutor (must be participant in the booking)

**Request:**
```http
PATCH /api/bookings/507f1f77bcf86cd799439011/cancel
Authorization: Bearer <jwt_token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Booking cancelled",
  "booking": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "CANCELLED",
    // ... other fields
  }
}
```

**Validation Rules:**
- ✅ Only student or tutor of the booking can cancel
- ✅ Cannot cancel if status is already `COMPLETED`
- ✅ Can cancel at any other status (PENDING, ACCEPTED, PAID)
- ✅ Sends notification to the other party

**Error Responses:**

```json
// 403 Forbidden - Not authorized
{
  "message": "Unauthorized"
}

// 400 Bad Request - Already completed
{
  "message": "Cannot cancel a completed booking"
}
```

---

## 🚫 3. Prevent Double Booking

### Implementation

The system automatically prevents double bookings using MongoDB time overlap validation.

**Validation Logic:**
```typescript
// Checks for conflicts where:
// 1. Same tutor
// 2. Active status (PENDING, ACCEPTED, or PAID)
// 3. Time overlap: (existingStart < newEnd) AND (existingEnd > newStart)
```

**Conflict Detection Query:**
```javascript
const conflict = await Booking.findOne({
  tutor: tutorId,
  status: { $in: ['PENDING', 'ACCEPTED', 'PAID'] },
  scheduledTime: { $lt: newEndTime },
  endTime: { $gt: newStartTime }
});
```

**Example Scenario:**

```
Existing Booking: 10:00 AM - 11:00 AM (ACCEPTED)
New Request:      10:30 AM - 11:30 AM
Result:           ❌ REJECTED (Conflict detected)

Existing Booking: 10:00 AM - 11:00 AM (ACCEPTED)
New Request:      11:00 AM - 12:00 PM
Result:           ✅ ALLOWED (No overlap)
```

**Error Response:**
```json
{
  "message": "Tutor is already booked for this time slot"
}
```

---

## 📊 4. Student Dashboard API

**Endpoint:** `GET /api/dashboard/student`

**Authorization:** Student only

**Request:**
```http
GET /api/dashboard/student
Authorization: Bearer <student_jwt_token>
```

**Response:**
```json
{
  "totalMoneySpent": 2500,
  "totalTutorsWorkedWith": 5,
  "totalSessionsCompleted": 12,
  "recentBookings": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "tutor": {
        "_id": "507f191e810c19729de860eb",
        "fullName": "John Doe",
        "profileImage": "https://..."
      },
      "status": "COMPLETED",
      "scheduledTime": "2026-02-15T10:00:00.000Z",
      "price": 500
    }
    // ... up to 10 recent bookings
  ],
  "recentTransactions": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "amount": 500,
      "status": "done",
      "createdAt": "2026-02-15T09:45:00.000Z"
    }
    // ... up to 10 recent transactions
  ]
}
```

**Aggregation Details:**
- ✅ `totalMoneySpent`: Sum of all COMPLETED booking prices
- ✅ `totalTutorsWorkedWith`: Count of distinct tutors from COMPLETED sessions
- ✅ `totalSessionsCompleted`: Count of COMPLETED bookings
- ✅ `recentBookings`: Last 10 bookings (all statuses), sorted by creation date
- ✅ `recentTransactions`: Last 10 transactions sent by student

---

## 👨‍🏫 5. Tutor Dashboard API

**Endpoint:** `GET /api/dashboard/tutor`

**Authorization:** Tutor only

**Request:**
```http
GET /api/dashboard/tutor
Authorization: Bearer <tutor_jwt_token>
```

**Response:**
```json
{
  "totalMoneyEarned": 4500,
  "totalStudentsWorkedWith": 8,
  "totalSessionsCompleted": 15,
  "averageRating": 4.7,
  "recentBookings": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "student": {
        "_id": "507f191e810c19729de860ea",
        "fullName": "Jane Smith",
        "profileImage": "https://..."
      },
      "status": "PAID",
      "scheduledTime": "2026-02-20T14:00:00.000Z",
      "price": 600
    }
    // ... up to 10 recent bookings
  ],
  "recentTransactions": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "amount": 600,
      "receiverAmount": 540,
      "commission": 60,
      "status": "done",
      "createdAt": "2026-02-15T10:30:00.000Z"
    }
    // ... up to 10 recent transactions
  ]
}
```

**Aggregation Details:**
- ✅ `totalMoneyEarned`: Sum of `receiverAmount` from all completed transactions (net earnings after commission)
- ✅ `totalStudentsWorkedWith`: Count of distinct students from COMPLETED sessions
- ✅ `totalSessionsCompleted`: Count of COMPLETED bookings
- ✅ `averageRating`: From TutorProfile (calculated atomically when reviews are posted)
- ✅ `recentBookings`: Last 10 bookings, sorted by creation date
- ✅ `recentTransactions`: Last 10 transactions received (status: done)

---

## 👑 6. Admin Dashboard API

**Endpoint:** `GET /api/dashboard/admin`

**Authorization:** Admin only

**Request:**
```http
GET /api/dashboard/admin
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "totalUsers": 150,
  "totalStudents": 100,
  "totalTutors": 45,
  "totalBookings": 320,
  "totalCompletedSessions": 280,
  "totalRevenue": 140000,
  "totalCommission": 14000
}
```

**Aggregation Details:**
- ✅ `totalUsers`: Count of all users (STUDENT + TUTOR + ADMIN)
- ✅ `totalStudents`: Count of users with role = STUDENT
- ✅ `totalTutors`: Count of users with role = TUTOR
- ✅ `totalBookings`: Count of all bookings (any status)
- ✅ `totalCompletedSessions`: Count of bookings with status = COMPLETED
- ✅ `totalRevenue`: Sum of all transaction amounts (status: done) - gross flow
- ✅ `totalCommission`: Sum of all transaction commissions (platform profit)

**Role Restriction:**
- ✅ Only users with role = ADMIN can access this endpoint
- ✅ Returns 403 Forbidden for non-admin users

---

## 🔐 Security Implementation

### Authentication & Authorization

All endpoints implement the following security measures:

1. **JWT Authentication**
   ```typescript
   router.use(authenticate); // Validates JWT token
   ```

2. **Role-Based Authorization**
   ```typescript
   // Student only
   authorizeRole('STUDENT')
   
   // Tutor only
   authorizeRole('TUTOR')
   
   // Admin only
   authorizeRole('ADMIN')
   
   // Multiple roles
   authorizeRoles('STUDENT', 'TUTOR')
   ```

3. **ObjectId Validation**
   - All MongoDB ObjectIds are validated before queries
   - Invalid IDs return 400 Bad Request

4. **Ownership Verification**
   - Users can only access/modify their own resources
   - Example: Only the tutor of a booking can complete it

5. **Error Handling**
   - All controllers use try-catch blocks
   - Consistent error response format
   - Proper HTTP status codes

---

## 🗄️ Database Indexes

### Booking Model Indexes

```typescript
// For student dashboard queries
bookingSchema.index({ student: 1, status: 1 });

// For tutor dashboard queries
bookingSchema.index({ tutor: 1, status: 1 });

// For double-booking prevention
bookingSchema.index({ tutor: 1, scheduledTime: 1, endTime: 1 });

// For admin dashboard
bookingSchema.index({ status: 1 });

// For recent bookings sorting
bookingSchema.index({ createdAt: -1 });
```

### Transaction Model Indexes

```typescript
transactionSchema.index({ sender: 1 });
transactionSchema.index({ receiver: 1 });
transactionSchema.index({ job: 1 });
transactionSchema.index({ transactionUuid: 1 });
```

---

## 📝 Complete API Route Summary

### Booking Routes
```
POST   /api/bookings/book              - Create booking (Student)
GET    /api/bookings                   - Get my bookings (Student/Tutor)
PATCH  /api/bookings/:bookingId/status - Accept/Reject (Tutor)
PATCH  /api/bookings/:id/complete      - Mark completed (Tutor)
PATCH  /api/bookings/:id/cancel        - Cancel booking (Student/Tutor)
```

### Dashboard Routes
```
GET    /api/dashboard/student          - Student stats (Student)
GET    /api/dashboard/tutor            - Tutor stats (Tutor)
GET    /api/dashboard/admin            - Admin stats (Admin)
```

### Review Routes
```
POST   /api/reviews/:bookingId         - Create review (Student, COMPLETED only)
GET    /api/reviews/tutor/:tutorId     - Get tutor reviews (Public)
```

---

## 🧪 Testing Guide

### Test Complete Booking

```bash
# 1. Login as tutor
POST /api/auth/login
{
  "email": "tutor@example.com",
  "password": "password123"
}

# 2. Complete a PAID booking
PATCH /api/bookings/507f1f77bcf86cd799439011/complete
Authorization: Bearer <tutor_token>
```

### Test Cancel Booking

```bash
# As student or tutor
PATCH /api/bookings/507f1f77bcf86cd799439011/cancel
Authorization: Bearer <token>
```

### Test Double Booking Prevention

```bash
# 1. Create first booking
POST /api/bookings/book
{
  "tutorId": "507f191e810c19729de860eb",
  "scheduledTime": "2026-02-20T10:00:00.000Z",
  "durationHours": 1
}

# 2. Try to create overlapping booking (should fail)
POST /api/bookings/book
{
  "tutorId": "507f191e810c19729de860eb",
  "scheduledTime": "2026-02-20T10:30:00.000Z",
  "durationHours": 1
}
# Expected: 409 Conflict - "Tutor is already booked for this time slot"
```

### Test Dashboards

```bash
# Student Dashboard
GET /api/dashboard/student
Authorization: Bearer <student_token>

# Tutor Dashboard
GET /api/dashboard/tutor
Authorization: Bearer <tutor_token>

# Admin Dashboard
GET /api/dashboard/admin
Authorization: Bearer <admin_token>
```

### Test Review Restriction

```bash
# Try to review non-completed booking (should fail)
POST /api/reviews/507f1f77bcf86cd799439011
Authorization: Bearer <student_token>
{
  "rating": 5,
  "comment": "Great session!"
}
# Expected: 400 Bad Request - "Cannot review booking that is not completed"

# Complete the booking first (as tutor)
PATCH /api/bookings/507f1f77bcf86cd799439011/complete
Authorization: Bearer <tutor_token>

# Now review should work
POST /api/reviews/507f1f77bcf86cd799439011
Authorization: Bearer <student_token>
{
  "rating": 5,
  "comment": "Great session!"
}
# Expected: 201 Created
```

---

## ✅ Feature Checklist

### Session Lifecycle Management
- [x] Booking model with all required statuses
- [x] PaymentStatus field (UNPAID/DONE)
- [x] Status transitions properly enforced
- [x] Reviews restricted to COMPLETED bookings
- [x] Complete endpoint (Tutor only)
- [x] Cancel endpoint (Student/Tutor)

### Double Booking Prevention
- [x] Time overlap validation
- [x] MongoDB query for conflict detection
- [x] Proper error messages
- [x] Optimized indexes for performance

### Student Dashboard
- [x] Total money spent calculation
- [x] Distinct tutors count
- [x] Completed sessions count
- [x] Last 10 bookings
- [x] Last 10 transactions
- [x] MongoDB aggregation pipeline

### Tutor Dashboard
- [x] Total money earned (net)
- [x] Distinct students count
- [x] Completed sessions count
- [x] Average rating
- [x] Last 10 bookings
- [x] Last 10 transactions
- [x] MongoDB aggregation pipeline

### Admin Dashboard
- [x] Total users count
- [x] Total tutors count
- [x] Total students count
- [x] Total bookings count
- [x] Total revenue calculation
- [x] Total commission calculation
- [x] Completed sessions count
- [x] Admin-only access restriction

### Security
- [x] JWT authentication on all routes
- [x] Role-based authorization
- [x] ObjectId validation
- [x] Ownership verification
- [x] Proper error handling
- [x] TypeScript strict mode
- [x] Service-Repository-Controller pattern

### Performance
- [x] MongoDB indexes on critical fields
- [x] Aggregation pipelines for dashboards
- [x] Efficient queries

---

## 🚀 Deployment Notes

1. **Environment Variables**
   - Ensure all JWT secrets are set
   - Configure MongoDB connection string
   - Set CORS origins appropriately

2. **Database Migrations**
   - Indexes will be created automatically on first run
   - No manual migration needed

3. **Monitoring**
   - Monitor dashboard query performance
   - Track double-booking prevention effectiveness
   - Monitor notification delivery

---

## 📚 Additional Resources

- [Authentication Documentation](./AUTH_DOCUMENTATION.md)
- [Backend Documentation](./BACKEND_DOCUMENTATION.md)
- [Tutor Discovery](./TUTOR_DISCOVERY.md)
- [Chat System](./CHAT_SYSTEM.md)

---

**Status:** ✅ All MVP features complete and production-ready

**Last Updated:** 2026-02-18

**Maintained by:** Antigravity Agent
