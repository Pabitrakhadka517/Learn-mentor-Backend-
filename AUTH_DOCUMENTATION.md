# 🔐 LearnMentor Authentication & Authorization System

## Overview

Production-ready authentication and authorization system for LearnMentor platform built with:
- **Node.js** + **Express**
- **MongoDB** (with Mongoose)
- **JWT** (Access + Refresh tokens)
- **bcrypt** (Password hashing)
- **Zod** (Input validation)
- **Rate Limiting** (Security)

## ✨ Features

### 🔑 Authentication
- ✅ User Registration (STUDENT & TUTOR only)
- ✅ User Login with JWT tokens
- ✅ Refresh Token Strategy (7-day expiry)
- ✅ Logout (Token invalidation)
- ✅ Password Reset Flow
- ✅ Account Status Validation (isActive, isVerified)

### 🛡️ Authorization
- ✅ Role-Based Access Control (RBAC)
- ✅ 3 Roles: **ADMIN**, **TUTOR**, **STUDENT**
- ✅ Protected Routes with Middleware
- ✅ Tutor Verification Check

### 🔒 Security
- ✅ bcrypt Password Hashing (10 rounds)
- ✅ HTTP-only Cookie Support (optional)
- ✅ Rate Limiting (5 attempts/15min for auth endpoints)
- ✅ Helmet Security Headers
- ✅ Input Validation with Zod
- ✅ Centralized Error Handling
- ✅ Token Expiry Management

---

## 📋 User Model

```typescript
{
  id: UUID (MongoDB ObjectId)
  fullName: string (optional)
  email: string (unique, required)
  phone: string (optional)
  passwordHash: string (required, hidden in responses)
  role: 'ADMIN' | 'TUTOR' | 'STUDENT' (default: STUDENT)
  isVerified: boolean (default: false, auto-true for ADMIN)
  isActive: boolean (default: true)
  profileImage: string (optional)
  speciality: string (optional)
  address: string (optional)
  location: { lat, lng, city, country } (optional)
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Update `.env` file:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/Learnmentor

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Admin Credentials
ADMIN_EMAIL=admin@learnmentor.com
ADMIN_PASSWORD=Admin@123

# Cloudinary (for profile images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional
CORS_ORIGIN=http://localhost:3000
```

### 3. Start MongoDB

```bash
# Make sure MongoDB is running
mongod
```

### 4. Run the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The server will:
1. Connect to MongoDB
2. Create admin user (if doesn't exist)
3. Start on `http://localhost:4000`

---

## 📚 API Endpoints

### Base URL: `http://localhost:4000/api/auth`

### 1️⃣ Register (Public)

**POST** `/register`

**Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass@123",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "role": "STUDENT" // or "TUTOR" (default: STUDENT)
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@example.com",
    "role": "STUDENT",
    "fullName": "John Doe",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-02-18T00:00:00.000Z",
    "updatedAt": "2026-02-18T00:00:00.000Z"
  }
}
```

**Notes:**
- ❌ **ADMIN** role cannot register via this endpoint
- ✅ Password must be at least 8 characters with uppercase, lowercase, number, and special character
- ✅ Email must be unique

---

### 2️⃣ Login

**POST** `/login`

**Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { /* user object */ }
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Account is deactivated

---

### 3️⃣ Refresh Token

**POST** `/refresh`

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4️⃣ Logout

**POST** `/logout`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5️⃣ Forgot Password

**POST** `/forgot-password`

**Body:**
```json
{
  "email": "student@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent."
}
```

**Note:** Reset token is logged to console (in production, send via email)

---

### 6️⃣ Reset Password

**POST** `/reset-password`

**Body:**
```json
{
  "token": "abc123def456...",
  "newPassword": "NewSecurePass@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

---

### 7️⃣ Get Current User

**GET** `/me`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "user": { /* user object */ }
}
```

---

## 🔐 JWT Token Structure

### Access Token (15 min expiry)
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "STUDENT",
  "email": "student@example.com",
  "iat": 1708214400,
  "exp": 1708215300
}
```

### Refresh Token (7 days expiry)
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "iat": 1708214400,
  "exp": 1708819200
}
```

---

## 🛡️ Middleware Usage

### 1. Authenticate (Validate JWT)

```typescript
import { authenticate } from './modules/auth/auth.middleware';

router.get('/protected', authenticate, (req: AuthRequest, res) => {
  // req.user is available here
  console.log(req.user.userId, req.user.role, req.user.email);
});
```

### 2. Authorize Roles (Restrict by Role)

```typescript
import { authenticate, authorizeRoles } from './modules/auth/auth.middleware';

// Only ADMIN can access
router.get('/admin/users', 
  authenticate, 
  authorizeRoles('ADMIN'), 
  controller
);

// TUTOR and ADMIN can access
router.get('/tutor/earnings', 
  authenticate, 
  authorizeRoles('TUTOR', 'ADMIN'), 
  controller
);

// Only STUDENT can access
router.post('/bookings', 
  authenticate, 
  authorizeRoles('STUDENT'), 
  controller
);
```

### 3. Verify Tutor (Check if Tutor is Verified)

```typescript
import { authenticate, authorizeRoles, verifyTutor } from './modules/auth/auth.middleware';

// Only verified tutors can access
router.post('/tutor/availability', 
  authenticate, 
  authorizeRoles('TUTOR'), 
  verifyTutor, // Checks isVerified for TUTOR role
  controller
);
```

---

## 🎯 Role-Based Access Examples

### Admin Routes
```typescript
router.get('/admin/users', authenticate, authorizeRoles('ADMIN'), getAllUsers);
router.patch('/admin/verify-tutor/:id', authenticate, authorizeRoles('ADMIN'), verifyTutor);
router.patch('/admin/approve-payout/:id', authenticate, authorizeRoles('ADMIN'), approvePayout);
```

### Tutor Routes
```typescript
router.get('/tutor/earnings', authenticate, authorizeRoles('TUTOR'), getEarnings);
router.post('/tutor/availability', authenticate, authorizeRoles('TUTOR'), verifyTutor, setAvailability);
```

### Student Routes
```typescript
router.post('/student/bookings', authenticate, authorizeRoles('STUDENT'), createBooking);
router.get('/student/my-bookings', authenticate, authorizeRoles('STUDENT'), getMyBookings);
```

---

## 🔒 Security Features

### 1. Rate Limiting

```typescript
// Auth endpoints: 5 requests per 15 minutes
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password

// General endpoints: 100 requests per 15 minutes
POST /api/auth/refresh
```

### 2. Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&#)

### 3. Account Status Rules

| Condition | Effect |
|-----------|--------|
| `isActive = false` | ❌ Login blocked |
| `isVerified = false` (TUTOR) | ⚠️ Restricted tutor-specific actions |
| `isVerified = false` (STUDENT) | ✅ No restrictions |
| `isVerified = true` (ADMIN) | ✅ Always verified |

---

## 📝 Admin Account

### Default Credentials
```
Email: admin@learnmentor.com
Password: Admin@123
```

⚠️ **IMPORTANT:** Change the admin password after first login!

### Create Admin Manually

Run the seeding script:
```bash
npm run dev
# Admin is auto-created on server start
```

Or use the seeding script directly:
```bash
npx ts-node src/modules/auth/auth.seeding.ts
```

---

## 🧪 Testing

### Using Swagger UI

Visit: `http://localhost:4000/swagger`

### Using Postman

Import the collection: `LearnMentor-Profile-API.postman_collection.json`

### Example Flow

1. **Register as Student**
   ```bash
   POST /api/auth/register
   {
     "email": "student@test.com",
     "password": "Test@123",
     "role": "STUDENT"
   }
   ```

2. **Login**
   ```bash
   POST /api/auth/login
   {
     "email": "student@test.com",
     "password": "Test@123"
   }
   ```
   Save the `accessToken` and `refreshToken`

3. **Access Protected Route**
   ```bash
   GET /api/auth/me
   Headers: Authorization: Bearer <accessToken>
   ```

4. **Refresh Token (when access token expires)**
   ```bash
   POST /api/auth/refresh
   {
     "refreshToken": "<refreshToken>"
   }
   ```

---

## 🏗️ Project Structure

```
src/
├── modules/
│   └── auth/
│       ├── user.model.ts           # User, RefreshToken, PasswordResetToken models
│       ├── auth.dto.ts             # Zod validation schemas & types
│       ├── auth.repository.ts      # Database operations
│       ├── auth.service.ts         # Business logic
│       ├── auth.controller.ts      # Request handlers
│       ├── auth.middleware.ts      # authenticate, authorizeRoles, verifyTutor
│       ├── auth.routes.ts          # API routes with rate limiting
│       └── auth.seeding.ts         # Admin seeding script
├── config/
│   ├── db.ts                       # MongoDB connection
│   └── jwt.ts                      # JWT & bcrypt configuration
├── middleware/
│   └── errorHandler.ts             # Centralized error handling
├── app.ts                          # Express app setup
└── server.ts                       # Server startup
```

---

## 🚨 Error Handling

All errors return consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* Validation errors if applicable */ ]
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request (validation failed) |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## 🔧 Environment-Specific Configuration

### Development
```env
NODE_ENV=development
JWT_ACCESS_SECRET=dev-access-secret
JWT_REFRESH_SECRET=dev-refresh-secret
```

### Production
```env
NODE_ENV=production
JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<different-strong-random-secret>
CORS_ORIGIN=https://yourdomain.com
```

---

## 📊 Database Collections

### users
- Stores all user accounts (ADMIN, TUTOR, STUDENT)
- Indexed on: `email`, `role`

### refreshtokens
- Stores active refresh tokens
- Indexed on: `userId`, `expiresAt`
- Auto-cleanup on expiry

### passwordresettokens
- Stores password reset tokens
- Indexed on: `userId`, `tokenHash`, `expiresAt`
- Auto-cleanup on expiry

---

## 🎓 Best Practices Implemented

✅ **Separation of Concerns** - Repository → Service → Controller pattern  
✅ **Input Validation** - Zod schemas for all inputs  
✅ **Error Handling** - Centralized error middleware  
✅ **Security Headers** - Helmet middleware  
✅ **Rate Limiting** - Prevent brute force attacks  
✅ **Token Management** - Refresh token strategy  
✅ **Password Security** - bcrypt with 10 rounds  
✅ **Type Safety** - Full TypeScript support  
✅ **API Documentation** - Swagger/OpenAPI  
✅ **Clean Code** - Readable and maintainable  

---

## 📞 Support

For issues or questions, check:
- Swagger Docs: `http://localhost:4000/swagger`
- Server Health: `http://localhost:4000/health`

---

## 🔄 Token Refresh Flow

```
1. User logs in → Receives accessToken (15min) + refreshToken (7days)
2. Frontend stores both tokens
3. On API call → Use accessToken in Authorization header
4. If accessToken expires (401) → Call /refresh with refreshToken
5. Receive new accessToken → Retry original request
6. If refreshToken expires → Force user to login again
```

---

## 🎉 You're All Set!

Your LearnMentor authentication system is now ready for production use! 🚀
