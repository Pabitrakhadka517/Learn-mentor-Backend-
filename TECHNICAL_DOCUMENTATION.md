# LearnMentor — Backend Technical Documentation

> **Version:** 1.0.0  
> **Last Updated:** February 2026  
> **Platform:** LearnMentor — Online Tutoring & Learning Management System  
> **Author:** LearnMentor Development Team

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
   - 1.1 [High-Level Architecture](#11-high-level-architecture)
   - 1.2 [Technology Stack](#12-technology-stack)
   - 1.3 [API Communication Flow](#13-api-communication-flow)
2. [Module-wise Backend Flow](#2-module-wise-backend-flow)
   - 2.1 [Authentication Module](#21-authentication-module)
   - 2.2 [Profile Module](#22-profile-module)
   - 2.3 [Admin Module](#23-admin-module)
   - 2.4 [Tutor Discovery Module](#24-tutor-discovery-module)
   - 2.5 [Booking Module](#25-booking-module)
   - 2.6 [Transaction (Payment) Module](#26-transaction-payment-module)
   - 2.7 [Chat Module](#27-chat-module)
   - 2.8 [Review Module](#28-review-module)
   - 2.9 [Notification Module](#29-notification-module)
   - 2.10 [Dashboard Module](#210-dashboard-module)
   - 2.11 [Study Resources Module](#211-study-resources-module)
   - 2.12 [Job Module](#212-job-module)
3. [Use Case-Based Backend Flow](#3-use-case-based-backend-flow)
   - 3.1 [Student Workflow](#31-student-workflow)
   - 3.2 [Tutor Workflow](#32-tutor-workflow)
   - 3.3 [Admin Workflow](#33-admin-workflow)
4. [Authentication & Security Flow](#4-authentication--security-flow)
   - 4.1 [Registration Flow](#41-registration-flow)
   - 4.2 [Login Flow](#42-login-flow)
   - 4.3 [Token Management](#43-token-management)
   - 4.4 [Password Encryption](#44-password-encryption)
   - 4.5 [Role-Based Access Control (RBAC)](#45-role-based-access-control-rbac)
   - 4.6 [Rate Limiting](#46-rate-limiting)
5. [Data Flow Diagram Explanation](#5-data-flow-diagram-explanation)
   - 5.1 [End-to-End Request Lifecycle](#51-end-to-end-request-lifecycle)
   - 5.2 [Validation & Transformation Layers](#52-validation--transformation-layers)
   - 5.3 [Real-Time Data Flow (Socket.io)](#53-real-time-data-flow-socketio)
6. [Database Architecture](#6-database-architecture)
   - 6.1 [MongoDB Collections](#61-mongodb-collections)
   - 6.2 [Indexes & Performance Optimizations](#62-indexes--performance-optimizations)
   - 6.3 [Entity Relationship Diagram](#63-entity-relationship-diagram)
7. [Deployment & Environment Configuration](#7-deployment--environment-configuration)
   - 7.1 [Server Environment](#71-server-environment)
   - 7.2 [Environment Variables](#72-environment-variables)
   - 7.3 [Database Configuration](#73-database-configuration)
   - 7.4 [Production vs Development Setup](#74-production-vs-development-setup)
8. [Error Handling Strategy](#8-error-handling-strategy)
9. [API Response Structure Standards](#9-api-response-structure-standards)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

LearnMentor follows a **three-tier client–server architecture** pattern, where the Flutter frontend communicates with a RESTful backend API server, which in turn interacts with a MongoDB database and external cloud services.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                                    │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
│  │   Flutter Mobile    │  │   Flutter Web App   │  │  Admin Dashboard │  │
│  │   Application       │  │   (Browser)          │  │  (Web)           │  │
│  └────────┬───────────┘  └────────┬────────────┘  └────────┬─────────┘  │
│           │         HTTP/REST + WebSocket           │                    │
└───────────┼──────────────────────┼──────────────────┼────────────────────┘
            │                      │                  │
            ▼                      ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION TIER                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Express.js + Node.js Server                    │   │
│  │  ┌────────┐  ┌────────────┐  ┌───────────┐  ┌───────────────┐  │   │
│  │  │ Helmet  │  │ CORS       │  │ Rate      │  │ Request       │  │   │
│  │  │ (Sec.)  │  │ Middleware │  │ Limiter   │  │ Logger        │  │   │
│  │  └────────┘  └────────────┘  └───────────┘  └───────────────┘  │   │
│  │                                                                  │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │                    JWT Authentication Layer                 │  │   │
│  │  │         authenticate → authorizeRoles → verifyTutor        │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  ┌───────┐ ┌────────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ │   │
│  │  │ Auth  │ │Profile │ │Tutor  │ │Booking│ │ Chat  │ │Review │ │   │
│  │  │Module │ │Module  │ │Module │ │Module │ │Module │ │Module │ │   │
│  │  └───────┘ └────────┘ └───────┘ └───────┘ └───────┘ └───────┘ │   │
│  │  ┌───────┐ ┌────────┐ ┌───────┐ ┌───────┐ ┌───────┐           │   │
│  │  │Admin  │ │Transac.│ │Notif. │ │Dashb. │ │Study  │           │   │
│  │  │Module │ │Module  │ │Module │ │Module │ │Module │           │   │
│  │  └───────┘ └────────┘ └───────┘ └───────┘ └───────┘           │   │
│  │                                                                  │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │                    Socket.io Server                         │  │   │
│  │  │    Real-time Chat │ Notifications │ Live Updates            │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└───────────┬──────────────────┬──────────────────┬────────────────────────┘
            │                  │                  │
            ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA / SERVICES TIER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   MongoDB     │  │  Cloudinary   │  │  Nodemailer   │  │  Ethereal  │  │
│  │   (Primary    │  │  (Image &     │  │  (Email       │  │  (Dev SMTP │  │
│  │   Database)   │  │  File CDN)    │  │  Service)     │  │  Testing)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Architecture Pattern:** The backend employs a **modular monolithic architecture** with clean separation of concerns following the **Controller → Service → Repository** pattern within each module. Each module is self-contained with its own routes, controllers, services, models, DTOs, and repository layers.

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 20.x+ | JavaScript runtime environment |
| **Language** | TypeScript | 5.9.x | Strongly-typed JavaScript superset |
| **Framework** | Express.js | 4.22.x | HTTP server and REST API framework |
| **Database** | MongoDB | via Mongoose 9.x | Primary NoSQL document database |
| **Real-Time** | Socket.io | 4.8.x | WebSocket-based real-time communication |
| **Authentication** | JSON Web Tokens (JWT) | 9.x | Stateless token-based authentication |
| **Password Hashing** | bcryptjs | 3.x | Secure password hashing with salt rounds |
| **Validation** | Zod | 3.25.x | Runtime schema validation with type inference |
| **File Upload** | Multer | 2.x | Multipart form data handling for file uploads |
| **Cloud Storage** | Cloudinary | 2.9.x | Image/file upload, storage, and CDN |
| **Email** | Nodemailer | 8.x | SMTP-based email delivery |
| **Security** | Helmet | 8.x | HTTP security header middleware |
| **Rate Limiting** | express-rate-limit | 8.x | API rate limiting and brute-force protection |
| **CORS** | cors | 2.8.x | Cross-Origin Resource Sharing middleware |
| **API Docs** | Swagger (swagger-jsdoc + swagger-ui-express) | 6.x / 5.x | Interactive API documentation |
| **Testing** | Jest + Supertest | 29.x / 7.x | Unit and integration testing framework |
| **Build** | TypeScript Compiler (tsc) | 5.9.x | Transpilation to JavaScript |
| **Dev Server** | ts-node-dev | 2.x | Hot-reload development server |

### 1.3 API Communication Flow

The communication between the Flutter frontend and the backend follows the standard **REST API** pattern over HTTP/HTTPS, supplemented by **WebSocket** connections for real-time features.

**REST API Flow:**
```
Flutter App                    Express.js Server                  MongoDB
    │                               │                               │
    │  HTTP Request (JSON)          │                               │
    │  Authorization: Bearer <JWT>  │                               │
    │──────────────────────────────>│                               │
    │                               │  Middleware Pipeline:          │
    │                               │  1. Helmet (security headers) │
    │                               │  2. CORS validation           │
    │                               │  3. Body parser (JSON)        │
    │                               │  4. Rate limiter check        │
    │                               │  5. Request logging           │
    │                               │  6. Route matching            │
    │                               │  7. JWT authentication        │
    │                               │  8. Role authorization        │
    │                               │                               │
    │                               │  Controller → Service →       │
    │                               │  Repository                   │
    │                               │──────────────────────────────>│
    │                               │                               │
    │                               │  Query Result                 │
    │                               │<──────────────────────────────│
    │                               │                               │
    │  HTTP Response (JSON)         │                               │
    │  { success, data, message }   │                               │
    │<──────────────────────────────│                               │
```

**WebSocket Flow (Real-Time Chat & Notifications):**
```
Flutter App                    Socket.io Server                  MongoDB
    │                               │                               │
    │  socket.connect()             │                               │
    │  auth: { token: <JWT> }       │                               │
    │──────────────────────────────>│                               │
    │                               │  Verify JWT token             │
    │                               │  Join user-specific room      │
    │                               │                               │
    │  emit('send_message', data)   │                               │
    │──────────────────────────────>│                               │
    │                               │  Validate & persist message   │
    │                               │──────────────────────────────>│
    │                               │                               │
    │                               │  emit('receive_message')      │
    │<──────────────────────────────│  (to all room participants)   │
    │                               │                               │
    │                               │  emit('new_notification')     │
    │<──────────────────────────────│  (to recipient's room)        │
```

**Base URL:** `http://localhost:4000/api`

**API Route Prefix Mapping:**

| Module | Route Prefix |
|--------|-------------|
| Authentication | `/api/auth` |
| Profile | `/api/profile` |
| Admin | `/api/admin` |
| Tutors | `/api/tutors` |
| Chat | `/api/chats` |
| Transactions | `/api/transactions` |
| Reviews | `/api/reviews` |
| Notifications | `/api/notifications` |
| Bookings | `/api/bookings` |
| Dashboard | `/api/dashboard` |
| Study Resources | `/api/study` |

---

## 2. Module-wise Backend Flow

### 2.1 Authentication Module

**Feature Name:** User Authentication & Authorization  
**Location:** `src/modules/auth/`

**Purpose and Business Logic:**  
Handles user registration, login, token management, password reset, and session management. Enforces that only STUDENT and TUTOR roles can self-register; ADMIN accounts are seeded at startup. Implements dual-token strategy with short-lived access tokens and long-lived refresh tokens.

#### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new user (STUDENT/TUTOR) |
| `POST` | `/api/auth/register/user` | Public | Register as STUDENT (alias) |
| `POST` | `/api/auth/register/tutor` | Public | Register as TUTOR (alias) |
| `POST` | `/api/auth/login` | Public | Login with email/password |
| `POST` | `/api/auth/refresh` | Public | Refresh access token using refresh token |
| `POST` | `/api/auth/logout` | Bearer JWT | Logout and invalidate refresh tokens |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset email |
| `POST` | `/api/auth/reset-password` | Public | Reset password using token |
| `GET`  | `/api/auth/me` | Bearer JWT | Get current authenticated user info |

#### Request/Response Formats

**POST `/api/auth/register`**
```json
// Request
{
  "email": "student@example.com",
  "password": "SecureP@ss1",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "role": "STUDENT"
}

// Response (201 Created)
{
  "success": true,
  "message": "User registered successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "email": "student@example.com",
    "role": "STUDENT",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-02-23T10:00:00.000Z",
    "updatedAt": "2026-02-23T10:00:00.000Z"
  }
}
```

**POST `/api/auth/login`**
```json
// Request
{
  "email": "student@example.com",
  "password": "SecureP@ss1"
}

// Response (200 OK)
{
  "success": true,
  "message": "Logged in successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "email": "student@example.com",
    "role": "STUDENT",
    "fullName": "John Doe",
    "isVerified": false,
    "isActive": true,
    "theme": "system"
  }
}
```

**POST `/api/auth/forgot-password`**
```json
// Request
{ "email": "student@example.com" }

// Response (200 OK)
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent.",
  "devResetLink": "http://localhost:3000/reset-password?token=abc123...",  // Dev only
  "emailPreviewUrl": "https://ethereal.email/message/..."  // Dev only
}
```

**POST `/api/auth/reset-password`**
```json
// Request
{
  "token": "abc123def456...",
  "newPassword": "NewSecure@1"
}

// Response (200 OK)
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

#### Data Validation Rules (Zod Schema)

| Field | Rules |
|-------|-------|
| `email` | Valid email format, required |
| `password` | Min 8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special char (`@$!%*?&#`) |
| `fullName` | Optional string |
| `phone` | Optional string |
| `role` | Enum: `STUDENT` or `TUTOR` (default: `STUDENT`). `ADMIN` rejected |

#### Database Collections Used

| Collection | Purpose |
|-----------|---------|
| `users` | Stores user accounts with hashed passwords |
| `refreshtokens` | Stores bcrypt-hashed refresh tokens per user |
| `passwordresettokens` | Stores SHA-256 hashed password reset tokens |

#### Error Handling

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| Validation failure (Zod) | 400 | `{ success: false, message: "Validation failed", errors: [...] }` |
| Email already exists | 400 | `{ success: false, message: "Email already exists" }` |
| Invalid credentials | 401 | `{ success: false, message: "Invalid credentials" }` |
| Account deactivated | 403 | `{ success: false, message: "Account is deactivated..." }` |
| Token expired | 401 | `{ success: false, message: "Token expired..." }` |
| Invalid/expired reset token | 400 | `{ success: false, message: "The reset token is invalid or has expired..." }` |

---

### 2.2 Profile Module

**Feature Name:** User Profile Management  
**Location:** `src/modules/profile/`

**Purpose and Business Logic:**  
Allows authenticated users to view and update their profile information, including personal details, profile images (via Cloudinary), password changes, and theme preferences. Tutor-specific fields (bio, hourly rate, subjects, languages, experience) are also managed through this module.

#### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/profile` | Bearer JWT | Get own profile |
| `PUT` | `/api/profile` | Bearer JWT | Update profile (multipart/form-data for image) |
| `PATCH` | `/api/profile/theme` | Bearer JWT | Update theme preference |
| `DELETE` | `/api/profile/image` | Bearer JWT | Delete profile image |

#### Request/Response Formats

**PUT `/api/profile`** (multipart/form-data)
```
Fields:
  name: "John Updated"
  phone: "1234567890"
  speciality: "Mathematics"
  address: "123 Main St, City"
  bio: "Expert math tutor"           // Tutor only
  hourlyRate: 50                      // Tutor only
  experienceYears: 5                  // Tutor only
  subjects: ["Mathematics", "Physics"] // Tutor only
  languages: ["English", "Spanish"]    // Tutor only
  oldPassword: "OldP@ss1"            // Required if changing password
  newPassword: "NewP@ss1"            // Requires oldPassword
File:
  profileImage: <binary image file, max 5MB>
```

```json
// Response (200 OK)
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "65a1b2c3...",
    "email": "tutor@example.com",
    "role": "TUTOR",
    "name": "John Updated",
    "phone": "1234567890",
    "speciality": "Mathematics",
    "profileImage": "https://res.cloudinary.com/...",
    "bio": "Expert math tutor",
    "hourlyRate": 50,
    "experienceYears": 5,
    "subjects": ["Mathematics", "Physics"],
    "languages": ["English", "Spanish"],
    "verificationStatus": "PENDING",
    "theme": "dark"
  }
}
```

#### Data Validation Rules

| Field | Rules |
|-------|-------|
| `name` | String, 2–100 characters |
| `phone` | Regex `^[0-9+]{10,15}$` |
| `speciality` | String, 2–200 characters |
| `address` | String, 5–500 characters |
| `bio` | String, max 2000 characters |
| `hourlyRate` | Number ≥ 0 |
| `experienceYears` | Number ≥ 0 |
| `profileImage` | Image files only, max 5MB |
| `newPassword` | Min 6 characters; requires `oldPassword` |

#### Database Collections Used

| Collection | Purpose |
|-----------|---------|
| `users` | Profile data (name, email, phone, image, theme) |
| `tutorprofiles` | Extended tutor-specific profile data |

#### Image Upload Flow
1. Client sends multipart form data with `profileImage` field
2. Multer middleware stores file in memory buffer
3. If user has existing image, old Cloudinary image is destroyed
4. New image uploaded to Cloudinary under `learnmentor/profiles/` folder
5. Image auto-cropped to 500×500 with quality optimization
6. Cloudinary URL stored in `users.profileImage`

---

### 2.3 Admin Module

**Feature Name:** Administrative Management  
**Location:** `src/modules/admin/`

**Purpose and Business Logic:**  
Provides administrative functionality including user management (CRUD), platform statistics, tutor verification, data seeding, and announcement broadcasting. All endpoints are restricted to users with the `ADMIN` role.

#### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/admin/users` | Admin | Get all users (paginated, filterable) |
| `GET` | `/api/admin/users/:id` | Admin | Get user details by ID |
| `PUT` | `/api/admin/users/:id` | Admin | Update user details |
| `DELETE` | `/api/admin/users/:id` | Admin | Delete user and related data |
| `GET` | `/api/admin/stats` | Admin | Get platform statistics |
| `PATCH` | `/api/admin/tutors/:tutorId/verify` | Admin | Verify/reject tutor |
| `POST` | `/api/admin/seed/tutors` | Admin | Seed random test tutors |
| `POST` | `/api/admin/announcements` | Admin | Create announcement |
| `GET` | `/api/admin/announcements` | Bearer JWT | Get announcements (role-filtered) |
| `DELETE` | `/api/admin/announcements/:id` | Admin | Delete announcement |

#### Request/Response Formats

**GET `/api/admin/users?page=1&limit=10&role=TUTOR`**
```json
// Response (200 OK)
{
  "success": true,
  "users": [
    {
      "id": "65a1b2c3...",
      "name": "Tutor Name",
      "email": "tutor@example.com",
      "phone": "+1234567890",
      "role": "TUTOR",
      "status": "Active",
      "joined": "2026-01-15T10:00:00.000Z",
      "speciality": "Mathematics",
      "hourlyRate": 50,
      "verificationStatus": "VERIFIED"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

**GET `/api/admin/stats`**
```json
// Response (200 OK)
{
  "total": 150,
  "tutors": 40,
  "students": 108,
  "admins": 2,
  "earnings": {
    "totalRevenue": 125000,
    "adminEarnings": 12500,
    "totalTransactions": 85,
    "averageCommission": "147.06"
  }
}
```

**PATCH `/api/admin/tutors/:tutorId/verify`**
```json
// Request
{ "status": "VERIFIED" }  // VERIFIED | REJECTED | PENDING

// Response (200 OK)
{
  "success": true,
  "message": "Tutor status updated to VERIFIED",
  "profile": { /* TutorProfile document */ }
}
```

**POST `/api/admin/announcements`**
```json
// Request
{
  "title": "Platform Maintenance",
  "content": "The platform will undergo maintenance on March 1st.",
  "targetRole": "ALL",     // ALL | STUDENT | TUTOR
  "type": "WARNING",       // INFO | WARNING | URGENT
  "expiresAt": "2026-03-01T00:00:00.000Z"
}
```

#### Database Collections Used

| Collection | Purpose |
|-----------|---------|
| `users` | User management operations (aggregation with lookup) |
| `tutorprofiles` | Tutor verification status updates |
| `transactions` | Revenue and commission aggregation for platform stats |
| `announcements` | Announcement CRUD operations |

---

### 2.4 Tutor Discovery Module

**Feature Name:** Tutor Search, Filtering & Profile Viewing  
**Location:** `src/modules/tutor/`

**Purpose and Business Logic:**  
Enables students to discover tutors through advanced filtering (subject, price range, language, availability), search functionality, and sorted results. Also manages tutor availability slots and verification submissions.

#### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/tutors` | Bearer JWT | List verified tutors (filterable, searchable, sortable) |
| `GET` | `/api/tutors/:id` | Bearer JWT | Get detailed tutor profile |
| `GET` | `/api/tutors/my/availability` | Tutor | Get own availability slots |
| `POST` | `/api/tutors/my/availability` | Tutor | Set/replace availability slots |
| `POST` | `/api/tutors/my/verify/submit` | Tutor | Submit profile for verification |

#### Request/Response Formats

**GET `/api/tutors?search=math&minPrice=20&maxPrice=80&sortBy=rating&page=1&limit=10`**
```json
// Response (200 OK)
{
  "success": true,
  "tutors": [
    {
      "_id": "65a1b2c3...",
      "profileId": "65b2c3d4...",
      "fullName": "Dr. Jane Smith",
      "profileImage": "https://res.cloudinary.com/...",
      "bio": "Expert mathematics tutor with 10 years experience",
      "experienceYears": 10,
      "hourlyRate": 60,
      "languages": ["English", "Spanish"],
      "subjects": ["Mathematics", "Physics"],
      "rating": 4.8,
      "reviewCount": 25,
      "verificationStatus": "VERIFIED",
      "nextAvailableSlot": {
        "startTime": "2026-02-25T10:00:00.000Z",
        "endTime": "2026-02-25T11:00:00.000Z"
      }
    }
  ],
  "total": 15,
  "page": 1,
  "totalPages": 2
}
```

**POST `/api/tutors/my/availability`**
```json
// Request
{
  "slots": [
    {
      "startTime": "2026-02-25T09:00:00.000Z",
      "endTime": "2026-02-25T10:00:00.000Z"
    },
    {
      "startTime": "2026-02-25T14:00:00.000Z",
      "endTime": "2026-02-25T15:00:00.000Z"
    }
  ]
}

// Response (200 OK)
{ "success": true, "message": "Availability updated successfully" }
```

#### Query Parameters for Tutor Search

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search on name, bio, subjects |
| `subject` | string | Filter by subject (case-insensitive partial match) |
| `language` | string | Filter by language |
| `minPrice` | number | Minimum hourly rate |
| `maxPrice` | number | Maximum hourly rate |
| `availability` | boolean | Only show tutors with available slots |
| `verifiedOnly` | boolean | Show only verified tutors |
| `sortBy` | enum | `price_asc`, `price_desc`, `newest`, `rating` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (1–50, default: 10) |

#### Database Collections Used

| Collection | Purpose |
|-----------|---------|
| `tutorprofiles` | Profile data, subjects, rates, verification status |
| `users` | Name, profile image (via `$lookup` aggregation) |
| `availabilityslots` | Tutor time slots with booking status |

#### Aggregation Pipeline (Search)
The tutor search uses a MongoDB aggregation pipeline with 8 stages:
1. **Match** — Filter by verification status, subject, language, price range
2. **Lookup** — Join with `users` collection for name/image
3. **Unwind** — Flatten user details
4. **Search** — Regex match on name, bio, subjects
5. **Lookup Availability** — Find next available unbooked slot
6. **Availability Filter** — Optionally filter tutors with no slots
7. **Project** — Select and rename fields for clean response
8. **Facet** — Pagination with total count

---

### 2.5 Booking Module

**Feature Name:** Session Booking & Management  
**Location:** `src/modules/booking/`

**Purpose and Business Logic:**  
Manages the complete booking lifecycle: creation by students, acceptance/rejection by tutors, payment tracking, completion, and cancellation. Includes double-booking prevention, automatic price calculation based on tutor hourly rate, and notification triggers.

#### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/bookings/book` | Student | Create new booking |
| `GET` | `/api/bookings` | Bearer JWT | Get own bookings (Student or Tutor) |
| `PATCH` | `/api/bookings/:bookingId/status` | Tutor/Admin | Accept or reject booking |
| `PATCH` | `/api/bookings/:id/complete` | Tutor/Student | Mark booking as completed |
| `PATCH` | `/api/bookings/:id/cancel` | Bearer JWT | Cancel a booking |
| `PUT` | `/api/bookings/:id` | Student | Edit pending booking details |

#### Request/Response Formats

**POST `/api/bookings/book`**
```json
// Request
{
  "tutorId": "65a1b2c3...",
  "startTime": "2026-03-01T10:00:00.000Z",
  "endTime": "2026-03-01T11:00:00.000Z",
  "notes": "Help with calculus integration"
}

// Response (201 Created)
{
  "success": true,
  "message": "Booking request sent successfully!",
  "booking": {
    "_id": "65c3d4e5...",
    "student": "65a1b2c3...",
    "tutor": "65b2c3d4...",
    "startTime": "2026-03-01T10:00:00.000Z",
    "endTime": "2026-03-01T11:00:00.000Z",
    "price": 60,
    "status": "PENDING",
    "paymentStatus": "UNPAID"
  }
}
```

#### Booking Status State Machine
```
    PENDING ──────> CONFIRMED ──────> PAID ──────> COMPLETED
       │                │                             │
       │                │                             │
       ▼                ▼                             │
    REJECTED         CANCELLED <──────────────────────┘
       │                ▲
       │                │
       └────────────────┘
```

| Status | Description |
|--------|-------------|
| `PENDING` | Booking created, awaiting tutor response |
| `CONFIRMED` | Tutor accepted the booking |
| `REJECTED` | Tutor rejected the booking |
| `PAID` | Student completed payment |
| `COMPLETED` | Session marked as completed |
| `CANCELLED` | Booking cancelled by either party |

#### Business Logic
1. **Price Calculation:** `price = tutor.hourlyRate × (endTime - startTime) in hours`
2. **Double-Booking Prevention:** Checks for overlapping time slots with status `PENDING/CONFIRMED/ACCEPTED/PAID`
3. **Notification Trigger:** `BOOKING_CREATED` sent to tutor on creation; `BOOKING_UPDATED` sent on status changes
4. **Tutor ID Resolution:** Accepts both User ID and TutorProfile ID (resolves via lookup)

#### Database Collections Used

| Collection | Purpose |
|-----------|---------|
| `bookings` | Booking CRUD operations, status management |
| `users` | Student/tutor reference and name lookup |
| `tutorprofiles` | Hourly rate for price calculation |
| `notifications` | Triggered on booking events |

---

### 2.6 Transaction (Payment) Module

**Feature Name:** Payment Processing & Transaction Management  
**Location:** `src/modules/transaction/`

**Purpose and Business Logic:**  
Handles payment initialization, processing, and commission calculation. Implements a platform commission model (10%) where the platform retains a percentage of each transaction. Supports both booking-based and job-based payments.

#### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/transactions/bookings/transaction/:bookingId` | Bearer JWT | Initialize booking payment |
| `POST` | `/api/transactions/bookings/transaction/:tId/pay` | Bearer JWT | Process booking payment |
| `GET` | `/api/transactions/jobs/transaction/:jobId` | Bearer JWT | Initialize job payment |
| `POST` | `/api/transactions/jobs/transaction/:tId/pay` | Bearer JWT | Process job payment |
| `GET` | `/api/transactions/transactions/sent` | Bearer JWT | Get sent payment history |
| `GET` | `/api/transactions/transactions/received` | Bearer JWT | Get received payment history |

#### Payment Flow (Step-by-Step)

```
Student                    Backend                     Tutor
   │                          │                          │
   │  1. Init Transaction     │                          │
   │  GET /bookings/          │                          │
   │  transaction/:bookingId  │                          │
   │─────────────────────────>│                          │
   │                          │ Create/find pending      │
   │                          │ transaction record       │
   │  transaction details     │                          │
   │<─────────────────────────│                          │
   │                          │                          │
   │  2. Process Payment      │                          │
   │  POST /bookings/         │                          │
   │  transaction/:tId/pay    │                          │
   │─────────────────────────>│                          │
   │                          │ Calculate 10% commission │
   │                          │ receiverAmt = amt * 0.9  │
   │                          │ Update tutor balance      │
   │                          │ Mark transaction "done"   │
   │                          │ Update booking to "PAID"  │
   │                          │ Create chat room          │
   │                          │ Send notification ───────>│
   │  Payment confirmed       │                          │
   │<─────────────────────────│                          │
```

#### Commission Structure
- **Total Amount:** `booking.price`
- **Commission Rate:** 10% (`0.10`)
- **Platform Commission:** `amount × 0.10`
- **Tutor Receives:** `amount × 0.90`
- **Balance Update:** `tutor.balance += receiverAmount`

#### Database Collections Used

| Collection | Purpose |
|-----------|---------|
| `transactions` | Payment records with sender, receiver, amounts, status |
| `bookings` | Status update to `PAID` on successful payment |
| `users` | Tutor balance update |
| `chatrooms` | Auto-created on successful payment |
| `notifications` | `PAYMENT_SUCCESS` notification to tutor |

---

### 2.7 Chat Module

**Feature Name:** Real-Time Messaging System  
**Location:** `src/modules/chat/` + `src/socket.ts`

**Purpose and Business Logic:**  
Provides real-time bidirectional messaging between students and tutors. Chat rooms are auto-created upon successful booking payment. Uses Socket.io for live message delivery and REST endpoints for message history. Includes message read receipts.

#### REST API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/chats` | Bearer JWT | Get active chat conversations |
| `POST` | `/api/chats` | Bearer JWT | Create/get chat room with user |
| `GET` | `/api/chats/:id/messages` | Bearer JWT | Get paginated message history |
| `POST` | `/api/chats/:id/messages` | Bearer JWT | Send message via REST |
| `POST` | `/api/chats/:id/read` | Bearer JWT | Mark messages as read |

#### Socket.io Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `connection` | Client → Server | `auth: { token }` | Authenticate WebSocket connection |
| `join_room` | Client → Server | `{ chatId }` | Join a specific chat room |
| `joined_room` | Server → Client | `{ chatId }` | Confirm room join |
| `send_message` | Client → Server | `{ chatId, content, attachments? }` | Send a message |
| `message_sent` | Server → Client | `{ success, messageId }` | Acknowledge message receipt |
| `receive_message` | Server → All in Room | `{ message object }` | Broadcast new message |
| `mark_read` | Client → Server | `{ chatId }` | Mark messages as read |
| `messages_read` | Server → Room | `{ byUser, chatId }` | Notify read status |
| `new_notification` | Server → Client | `{ notification }` | Push notification |
| `error` | Server → Client | `{ message }` | Error notification |

#### Chat Access Control
- Chat rooms require a **paid booking** (`PAID` or `COMPLETED` status) between the student and tutor
- Socket connections are authenticated via JWT token in handshake
- Users can only join rooms they are participants of
- Only active chats allow new messages

#### Database Collections Used

| Collection | Purpose |
|-----------|---------|
| `chatrooms` | Chat room metadata (student, tutor, booking reference, last message) |
| `messages` | Individual messages with sender, content, read status |
| `bookings` | Validates paid booking exists before chat creation |

---

### 2.8 Review Module

**Feature Name:** Tutor Rating & Review System  
**Location:** `src/modules/review/`

**Purpose and Business Logic:**  
Allows students to rate and review tutors after completing a booking session. Enforces one review per booking with rating validation (1–5 stars). Automatically updates the tutor's aggregate rating and review count.

#### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/reviews/:bookingId` | Bearer JWT | Create review for completed booking |
| `GET` | `/api/reviews/tutor/:tutorId` | Public | Get all reviews for a tutor |

#### Request/Response Formats

**POST `/api/reviews/:bookingId`**
```json
// Request
{
  "rating": 5,
  "comment": "Excellent tutor! Explained calculus very clearly."
}

// Response (201 Created)
{
  "success": true,
  "message": "Review submitted successfully",
  "review": {
    "_id": "65d4e5f6...",
    "booking": "65c3d4e5...",
    "tutor": "65b2c3d4...",
    "student": "65a1b2c3...",
    "rating": 5,
    "comment": "Excellent tutor! Explained calculus very clearly."
  }
}
```

**GET `/api/reviews/tutor/:tutorId`**
```json
// Response (200 OK)
{
  "success": true,
  "averageRating": 4.7,
  "totalReviews": 23,
  "reviews": [
    {
      "_id": "65d4e5f6...",
      "student": {
        "fullName": "John Doe",
        "profileImage": "https://res.cloudinary.com/..."
      },
      "rating": 5,
      "comment": "Excellent tutor!",
      "createdAt": "2026-02-20T10:00:00.000Z"
    }
  ]
}
```

#### Business Rules
1. Only the booking's student can create a review
2. Booking must be in `COMPLETED` status
3. Maximum one review per booking (unique constraint)
4. Rating must be integer between 1 and 5
5. Comment is optional, max 500 characters
6. Upon creation, tutor's aggregate `averageRating` and `totalReviews` are recalculated

#### Rating Aggregation Formula
```
newTotal = currentTotal + 1
newAverage = ((currentAverage × currentTotal) + newRating) / newTotal
```

#### Database Collections Used

| Collection | Purpose |
|-----------|---------|
| `reviews` | Review records (booking ref, rating, comment) |
| `bookings` | Validate booking ownership and status |
| `tutorprofiles` | Update aggregate rating/review count |
| `notifications` | `NEW_REVIEW` notification to tutor |

---

### 2.9 Notification Module

**Feature Name:** In-App Notification System  
**Location:** `src/modules/notification/`

**Purpose and Business Logic:**  
Manages system-wide notifications with real-time delivery via Socket.io. Notifications are triggered by system events (booking creation, status updates, payments, reviews) and delivered both via REST API (pull) and WebSocket (push).

#### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/notifications` | Bearer JWT | Get paginated notifications |
| `GET` | `/api/notifications/unread-count` | Bearer JWT | Get unread notification count |
| `PATCH` | `/api/notifications/:id/read` | Bearer JWT | Mark notification as read |
| `PATCH` | `/api/notifications/read-all` | Bearer JWT | Mark all as read |
| `DELETE` | `/api/notifications/:id` | Bearer JWT | Delete a notification |

#### Notification Types

| Type | Trigger | Recipient |
|------|---------|-----------|
| `BOOKING_CREATED` | New booking created | Tutor |
| `BOOKING_UPDATED` | Booking status changed | Student or Tutor |
| `PAYMENT_SUCCESS` | Payment processed | Tutor |
| `NEW_REVIEW` | Review submitted | Tutor |
| `ADMIN_MESSAGE` | Admin broadcast | Target users |

#### Real-Time Delivery
Notifications are pushed to connected clients via Socket.io:
```javascript
io.to(recipientUserId).emit('new_notification', notification);
```
Each user joins their own Socket.io room on connection, identified by their user ID.

#### Database Collections Used

| Collection | Purpose |
|-----------|---------|
| `notifications` | Notification storage with read status tracking |

---

### 2.10 Dashboard Module

**Feature Name:** Role-Specific Dashboard Statistics  
**Location:** `src/modules/dashboard/`

**Purpose and Business Logic:**  
Provides aggregated statistics tailored to each user role. Each role has a dedicated endpoint returning relevant metrics computed through MongoDB aggregation pipelines.

#### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/dashboard/student` | Student | Student dashboard stats |
| `GET` | `/api/dashboard/tutor` | Tutor | Tutor dashboard stats |
| `GET` | `/api/dashboard/admin` | Admin | Admin dashboard stats |

#### Response Formats

**Student Dashboard Stats:**
```json
{
  "success": true,
  "stats": {
    "totalBookings": 12,
    "upcomingBookings": 3,
    "completedBookings": 8,
    "totalSpent": 480,
    "totalTutorsWorkedWith": 5
  },
  "recentBookings": [ /* last 10 bookings */ ],
  "recentTransactions": [ /* last 10 transactions */ ]
}
```

**Tutor Dashboard Stats:**
```json
{
  "success": true,
  "stats": {
    "totalEarnings": 4320,
    "totalStudentsWorkedWith": 15,
    "totalBookings": 25,
    "completedBookings": 20,
    "pendingBookings": 3,
    "averageRating": 4.7,
    "verificationStatus": "VERIFIED"
  },
  "recentBookings": [ /* last 10 bookings */ ],
  "recentTransactions": [ /* last 10 received transactions */ ]
}
```

**Admin Dashboard Stats:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalStudents": 108,
    "totalTutors": 40,
    "totalBookings": 320,
    "totalCompletedSessions": 250,
    "totalRevenue": 125000,
    "totalCommission": 12500,
    "pendingVerifications": 5
  }
}
```

#### Database Collections Used

| Collection | Purpose |
|-----------|---------|
| `bookings` | Aggregation for booking stats per role |
| `transactions` | Revenue, earnings, and commission aggregation |
| `users` | User count by role |
| `tutorprofiles` | Rating and verification data |

---

### 2.11 Study Resources Module

**Feature Name:** Study Material Library  
**Location:** `src/modules/study/`

**Purpose and Business Logic:**  
Allows tutors to upload educational resources (PDFs, documents, modules) to a shared library accessible by students. Files are uploaded to Cloudinary. Supports category-based filtering and public/private visibility.

#### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/study` | Public | Get public study resources |
| `GET` | `/api/study/my` | Tutor/Admin | Get own uploaded resources |
| `POST` | `/api/study/upload` | Tutor/Admin | Upload new resource (multipart) |
| `DELETE` | `/api/study/:id` | Tutor/Admin | Delete own resource |

#### Request/Response Formats

**POST `/api/study/upload`** (multipart/form-data)
```
Fields:
  title: "Calculus Fundamentals"
  category: "Math"
  type: "PDF"              // PDF | MODULE | OTHER
  isPublic: true
File:
  resource: <binary file, max 50MB>
```

```json
// Response (201 Created)
{
  "success": true,
  "resource": {
    "_id": "65e5f6a7...",
    "title": "Calculus Fundamentals",
    "category": "Math",
    "type": "PDF",
    "url": "https://res.cloudinary.com/...",
    "size": "2.50 MB",
    "tutor": "65b2c3d4...",
    "isPublic": true
  },
  "message": "Resource uploaded successfully"
}
```

#### Supported File Types
- `application/pdf`
- `application/msword` (.doc)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)
- `application/vnd.ms-powerpoint` (.ppt)
- `application/vnd.openxmlformats-officedocument.presentationml.presentation` (.pptx)
- `image/*` (all image types)
- **Max file size:** 50MB

#### Database Collections Used

| Collection | Purpose |
|-----------|---------|
| `studyresources` | Resource metadata (title, category, URL, tutor ref) |

---

### 2.12 Job Module

**Feature Name:** Job/Task Management (Legacy/Secondary)  
**Location:** `src/modules/job/`

**Purpose and Business Logic:**  
Provides a data model for job/task assignments between users. Supports a payment workflow integrated with the Transaction module. Used as a secondary payment pathway alongside bookings.

#### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Job title |
| `description` | String | Job details |
| `sender` | ObjectId (User) | User who created the job (payer) |
| `receiver` | ObjectId (User) | User who receives payment |
| `amount` | Number | Payment amount |
| `status` | Enum | `pending`, `active`, `finished`, `cancelled` |
| `paymentStatus` | Enum | `pending`, `done`, `failed` |

---

## 3. Use Case-Based Backend Flow

### 3.1 Student Workflow

#### Use Case 1: Student Registration & Login

**Step-by-step backend execution flow:**

1. **Registration:**
   - Student submits `POST /api/auth/register` with email, password, name
   - Rate limiter validates request count (100 per 15 minutes)
   - `AuthController.register()` invoked
   - `RegisterDTOSchema.parse()` validates input via Zod (email format, password strength)
   - `AuthRepository.emailExists()` checks for duplicate email in MongoDB
   - `AuthRepository.hashPassword()` hashes password with bcrypt (10 salt rounds)
   - `AuthRepository.createUser()` creates user document with role `STUDENT`
   - `AuthService.generateTokens()` creates JWT access token (15m) and refresh token (7d)
   - Refresh token hashed with bcrypt, stored in `refreshtokens` collection
   - Response returned with tokens and user object

2. **Login:**
   - Student submits `POST /api/auth/login` with email, password
   - Rate limiter check
   - `LoginDTOSchema.parse()` validates input
   - `AuthRepository.findByEmail()` retrieves user from MongoDB
   - Checks `user.isActive` flag
   - `AuthRepository.verifyPassword()` compares password with bcrypt
   - Generates new access/refresh tokens
   - Old refresh tokens deleted, new one stored
   - Response with tokens and user profile

#### Use Case 2: Student Discovers and Books a Tutor

**Step-by-step backend execution flow:**

1. **Browse Tutors:**
   - `GET /api/tutors?search=math&sortBy=rating`
   - `authenticate` middleware validates JWT from `Authorization` header
   - `authorizeRoles('STUDENT', 'ADMIN', 'TUTOR')` verifies role
   - `TutorQuerySchema.parse()` validates query parameters
   - MongoDB aggregation pipeline executes 8-stage query
   - Returns paginated tutor list with ratings and availability

2. **View Tutor Profile:**
   - `GET /api/tutors/:id`
   - Validates ObjectId format
   - Fetches TutorProfile with user details (populated)
   - Fetches next 20 available slots
   - Returns comprehensive tutor profile

3. **Create Booking:**
   - `POST /api/bookings/book` with tutorId, startTime, endTime
   - `authorizeRoles('STUDENT')` ensures only students can book
   - Resolves tutor ID (accepts User ID or TutorProfile ID)
   - Validates date formats, ensures start < end, no past dates
   - Checks for double-booking conflicts in database
   - Calculates price: `hourlyRate × duration`
   - Creates booking with status `PENDING`, paymentStatus `UNPAID`
   - Creates `BOOKING_CREATED` notification for tutor
   - Socket.io pushes notification to tutor

4. **Make Payment:**
   - `GET /api/transactions/bookings/transaction/:bookingId` — initializes transaction
   - `POST /api/transactions/bookings/transaction/:tId/pay` — processes payment
   - Calculates 10% commission
   - Updates tutor balance
   - Changes booking status to `PAID`
   - Auto-creates chat room between student and tutor
   - Sends `PAYMENT_SUCCESS` notification to tutor

5. **Chat with Tutor:**
   - Connects to Socket.io with JWT token
   - `join_room` event to enter chat room
   - `send_message` event to send messages
   - Messages persisted in MongoDB
   - Real-time delivery to tutor via Socket.io

6. **Complete Session & Review:**
   - `PATCH /api/bookings/:id/complete` — marks booking completed
   - `POST /api/reviews/:bookingId` — submits rating (1–5) and comment
   - Tutor's aggregate rating recalculated
   - `NEW_REVIEW` notification sent to tutor

### 3.2 Tutor Workflow

#### Use Case 1: Tutor Registration & Profile Setup

**Step-by-step backend execution flow:**

1. **Registration:**
   - `POST /api/auth/register/tutor` or `POST /api/auth/register` with `role: "TUTOR"`
   - Same validation flow as student registration
   - Additional step: `TutorProfile.create()` creates initial tutor profile with `verificationStatus: "PENDING"`
   - Returns tokens and user object with `verificationStatus`

2. **Profile Setup:**
   - `PUT /api/profile` with tutor-specific fields
   - Updates both `users` collection (name, phone, specialty) and `tutorprofiles` collection (bio, hourlyRate, subjects, languages, experienceYears)
   - Profile image uploaded to Cloudinary if provided

3. **Submit for Verification:**
   - `POST /api/tutors/my/verify/submit`
   - Sets `verificationStatus` to `PENDING`
   - Waits for admin to verify/reject

4. **Set Availability:**
   - `POST /api/tutors/my/availability`
   - Deletes all future unbooked slots
   - Inserts new availability slots
   - These slots appear to students browsing tutors

#### Use Case 2: Tutor Manages Bookings

1. **Receives booking notification** via Socket.io (`new_notification`)
2. **Views bookings:** `GET /api/bookings`
3. **Accepts:** `PATCH /api/bookings/:bookingId/status` with `{ "status": "CONFIRMED" }`
   - Student receives `BOOKING_UPDATED` notification
4. **After payment:** Chat room auto-created
5. **Completes session:** `PATCH /api/bookings/:id/complete`
6. **Views earnings:** `GET /api/dashboard/tutor`

### 3.3 Admin Workflow

#### Use Case 1: Admin Manages Platform

**Step-by-step backend execution flow:**

1. **Login:**
   - Admin account seeded at server startup (`seedAdmin()`)
   - Default credentials from environment variables or fallback
   - Standard login flow

2. **View Dashboard:**
   - `GET /api/dashboard/admin`
   - Aggregates user counts by role, booking totals, revenue, commissions
   - Returns comprehensive platform statistics

3. **Manage Users:**
   - `GET /api/admin/users?page=1&limit=10&role=TUTOR`
   - MongoDB aggregation with `$lookup` to join `tutorprofiles`
   - `$facet` for pagination metadata

4. **Verify Tutors:**
   - `PATCH /api/admin/tutors/:tutorId/verify` with `{ "status": "VERIFIED" }`
   - Updates `tutorprofiles.verificationStatus`
   - Verified tutors become visible in student search

5. **Create Announcements:**
   - `POST /api/admin/announcements`
   - Targets specific roles (ALL, STUDENT, TUTOR)
   - Types: INFO, WARNING, URGENT

6. **Delete Users:**
   - `DELETE /api/admin/users/:id`
   - Deletes user document and associated TutorProfile

**Middleware Chain for All Admin Endpoints:**
```
Request → authenticate (JWT validation) → authorizeRoles('ADMIN') → Controller
```

---

## 4. Authentication & Security Flow

### 4.1 Registration Flow

```
Client                          Server
  │                               │
  │  POST /api/auth/register      │
  │  { email, password, role }    │
  │──────────────────────────────>│
  │                               │
  │                    ┌──────────┴──────────┐
  │                    │ 1. Rate Limiter     │
  │                    │    (100 req/15 min) │
  │                    ├─────────────────────┤
  │                    │ 2. Zod Validation   │
  │                    │    - Email format   │
  │                    │    - Password rules │
  │                    │    - Role check     │
  │                    ├─────────────────────┤
  │                    │ 3. ADMIN role check │
  │                    │    (rejected)       │
  │                    ├─────────────────────┤
  │                    │ 4. Email uniqueness │
  │                    │    check (MongoDB)  │
  │                    ├─────────────────────┤
  │                    │ 5. bcrypt hash      │
  │                    │    (10 salt rounds) │
  │                    ├─────────────────────┤
  │                    │ 6. Create User doc  │
  │                    ├─────────────────────┤
  │                    │ 7. If TUTOR: create │
  │                    │    TutorProfile     │
  │                    ├─────────────────────┤
  │                    │ 8. Generate JWT     │
  │                    │    access (15m)     │
  │                    │    refresh (7d)     │
  │                    ├─────────────────────┤
  │                    │ 9. Hash & store     │
  │                    │    refresh token    │
  │                    └──────────┬──────────┘
  │                               │
  │  201 Created                  │
  │  { accessToken, refreshToken, │
  │    user }                     │
  │<──────────────────────────────│
```

### 4.2 Login Flow

```
Client                          Server
  │                               │
  │  POST /api/auth/login         │
  │  { email, password }          │
  │──────────────────────────────>│
  │                               │
  │                    ┌──────────┴──────────┐
  │                    │ 1. Rate Limiter     │
  │                    ├─────────────────────┤
  │                    │ 2. Zod Validation   │
  │                    ├─────────────────────┤
  │                    │ 3. Find user by     │
  │                    │    email (MongoDB)  │
  │                    ├─────────────────────┤
  │                    │ 4. Check isActive   │
  │                    ├─────────────────────┤
  │                    │ 5. bcrypt.compare() │
  │                    │    password verify  │
  │                    ├─────────────────────┤
  │                    │ 6. Generate tokens  │
  │                    ├─────────────────────┤
  │                    │ 7. Delete old       │
  │                    │    refresh tokens   │
  │                    ├─────────────────────┤
  │                    │ 8. Store new hashed │
  │                    │    refresh token    │
  │                    ├─────────────────────┤
  │                    │ 9. Populate profile │
  │                    │    (tutor status)   │
  │                    └──────────┬──────────┘
  │                               │
  │  200 OK                       │
  │  { accessToken, refreshToken, │
  │    user }                     │
  │<──────────────────────────────│
```

### 4.3 Token Management

**Dual-Token Strategy:**

| Token | Algorithm | Secret | Expiry | Storage | Purpose |
|-------|-----------|--------|--------|---------|---------|
| **Access Token** | HS256 | `JWT_ACCESS_SECRET` | 15 minutes | Client memory / secure storage | API authentication |
| **Refresh Token** | HS256 | `JWT_REFRESH_SECRET` | 7 days | Client secure storage + DB (hashed) | Access token renewal |
| **Reset Token** | Random bytes (SHA-256) | N/A | 15 minutes | DB (SHA-256 hashed) | Password reset |

**Access Token Payload:**
```json
{
  "userId": "65a1b2c3d4e5f6a7b8c9d0e1",
  "role": "STUDENT",
  "email": "student@example.com",
  "iat": 1708732800,
  "exp": 1708733700
}
```

**Token Refresh Flow:**
1. Client sends expired access token detection
2. `POST /api/auth/refresh` with `refreshToken` in body
3. Server verifies refresh token JWT signature
4. Finds user, checks `isActive` status
5. Finds matching refresh token in DB via `bcrypt.compare()`
6. Issues new access token
7. Returns new access token only (refresh token unchanged)

**Token Revocation:**
- Logout: All refresh tokens deleted for user
- Password reset: All refresh tokens deleted (forces re-login)
- One refresh token per user (old tokens deleted on new login)

### 4.4 Password Encryption

| Mechanism | Algorithm | Configuration | Usage |
|-----------|-----------|--------------|-------|
| **Password Storage** | bcrypt | 10 salt rounds | User passwords, refresh tokens |
| **Password Reset Token** | SHA-256 | crypto.createHash | Reset tokens before DB storage |
| **Token Generation** | crypto.randomBytes | 32 bytes → hex | Password reset token creation |

**Password Validation Rules (Zod):**
- Minimum 8 characters
- At least 1 uppercase letter (`[A-Z]`)
- At least 1 lowercase letter (`[a-z]`)
- At least 1 digit (`[0-9]`)
- At least 1 special character (`[@$!%*?&#]`)

### 4.5 Role-Based Access Control (RBAC)

**User Roles:**

| Role | Description | Self-Registerable |
|------|-------------|-------------------|
| `STUDENT` | Learners who browse tutors, book sessions, make payments | Yes |
| `TUTOR` | Educators who offer sessions, manage availability | Yes |
| `ADMIN` | Platform administrators with full management access | No (seeded only) |

**Middleware Stack:**

```typescript
// Public endpoint (no auth required)
router.post('/register', authLimiter, AuthController.register);

// Authenticated endpoint (any logged-in user)
router.get('/', authenticate, ChatController.getChats);

// Role-restricted endpoint (specific roles)
router.post('/book', authenticate, authorizeRoles('STUDENT'), BookingController.createBooking);

// Admin-only endpoint
router.get('/users', authenticate, authorizeRoles('ADMIN'), AdminController.getAllUsers);

// Tutor verification check
router.post('/session', authenticate, authorizeRoles('TUTOR'), verifyTutor, Controller.method);
```

**Authorization Middleware Chain:**

| Middleware | Purpose | Failure Response |
|-----------|---------|-----------------|
| `authenticate` | Validates JWT, attaches user to request | 401 Unauthorized |
| `authorizeRoles(...roles)` | Checks user role against allowed roles | 403 Forbidden |
| `authorizeRole(role)` | Single-role convenience wrapper | 403 Forbidden |
| `verifyTutor` | Checks tutor's `isVerified` status | 403 Forbidden |
| `optionalAuthenticate` | Attaches user if token valid, continues regardless | N/A (silent) |

**Endpoint Access Matrix:**

| Endpoint Category | STUDENT | TUTOR | ADMIN |
|-------------------|---------|-------|-------|
| Auth (register, login) | ✅ | ✅ | ✅ |
| Profile (own) | ✅ | ✅ | ✅ |
| Browse Tutors | ✅ | ✅ | ✅ |
| Create Booking | ✅ | ❌ | ❌ |
| Accept/Reject Booking | ❌ | ✅ | ✅ |
| Chat | ✅ | ✅ | ❌ |
| Create Review | ✅ | ❌ | ❌ |
| Set Availability | ❌ | ✅ | ❌ |
| Upload Study Material | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| Verify Tutors | ❌ | ❌ | ✅ |
| Platform Stats | ❌ | ❌ | ✅ |
| Announcements (create) | ❌ | ❌ | ✅ |
| Dashboard (own role) | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| Payment | ✅ | ❌ | ❌ |
| Payment History | ✅ | ✅ | ❌ |

### 4.6 Rate Limiting

| Limiter | Window | Max Requests | Applied To |
|---------|--------|-------------|------------|
| `authLimiter` | 15 minutes | 100 (dev) / 100 (prod) | Login, register, password reset |
| `generalLimiter` | 15 minutes | 100 | Token refresh, general endpoints |

Rate limit responses include standard headers (`RateLimit-*`) and return:
```json
{
  "success": false,
  "message": "Too many authentication attempts. Please try again after 15 minutes."
}
```

---

## 5. Data Flow Diagram Explanation

### 5.1 End-to-End Request Lifecycle

```
Flutter UI                                     Express.js Server
┌─────────┐                              ┌──────────────────────────────┐
│ User     │  HTTP Request                │                              │
│ Action   │──────────────────────────────│──> Helmet (Security Headers) │
│ (Button  │  Authorization: Bearer JWT   │──> CORS Check                │
│  Click)  │                              │──> Body Parser (JSON/Form)   │
└─────────┘                              │──> Rate Limiter              │
                                          │──> Request Logger            │
                                          │──> Route Matching            │
                                          │                              │
                                          │    ┌──────────────┐          │
                                          │    │ authenticate │          │
                                          │    │ (JWT verify) │          │
                                          │    └──────┬───────┘          │
                                          │           │                  │
                                          │    ┌──────┴───────┐          │
                                          │    │authorizeRoles│          │
                                          │    │(role check)  │          │
                                          │    └──────┬───────┘          │
                                          │           │                  │
                                          │    ┌──────┴───────┐          │
                                          │    │  Controller   │          │
                                          │    │ (HTTP layer)  │          │
                                          │    └──────┬───────┘          │
                                          │           │                  │
                                          │    ┌──────┴───────┐          │
                                          │    │   Service     │          │
                                          │    │ (business     │          │
                                          │    │  logic)       │          │
                                          │    └──────┬───────┘          │
                                          │           │                  │
                                          │    ┌──────┴───────┐          │
                                          │    │  Repository   │          │
                                          │    │ (data access) │          │
                                          │    └──────┬───────┘          │
                                          └───────────┼──────────────────┘
                                                      │
                                               ┌──────┴───────┐
                                               │   MongoDB     │
                                               │  (Mongoose)   │
                                               └──────┬───────┘
                                                      │
                                          ┌───────────┼──────────────────┐
                                          │    ┌──────┴───────┐          │
                                          │    │  Repository   │          │
                                          │    │ (format data) │          │
                                          │    └──────┬───────┘          │
                                          │           │                  │
                                          │    ┌──────┴───────┐          │
                                          │    │   Service     │          │
                                          │    │ (transform)   │          │
                                          │    └──────┬───────┘          │
                                          │           │                  │
                                          │    ┌──────┴───────┐          │
                                          │    │  Controller   │          │
                                          │    │ (JSON resp.)  │          │
                                          │    └──────┬───────┘          │
                                          │           │                  │
                                          │    ┌──────┴───────┐          │
                                          │    │ Error Handler │          │
                                          │    │ (if error)    │          │
                                          │    └──────┬───────┘          │
                                          └───────────┼──────────────────┘
                                                      │
┌─────────┐                                           │
│ Flutter  │  HTTP Response                           │
│ App      │<─────────────────────────────────────────┘
│ (Update  │  { success: true, data: {...} }
│  UI)     │
└─────────┘
```

### 5.2 Validation & Transformation Layers

The data passes through multiple validation and transformation layers:

| Layer | Mechanism | Purpose | Example |
|-------|-----------|---------|---------|
| **1. Transport** | Express body parser | Parse raw JSON/form data | `express.json({ limit: '10mb' })` |
| **2. Rate Limiting** | express-rate-limit | Prevent abuse | 100 requests per 15 min |
| **3. Authentication** | JWT middleware | Verify user identity | `jwt.verify(token, secret)` |
| **4. Authorization** | Role middleware | Verify permissions | `authorizeRoles('ADMIN')` |
| **5. Input Validation** | Zod schemas | Validate request data | `RegisterDTOSchema.parse(dto)` |
| **6. Business Validation** | Service layer | Business rule checks | Email uniqueness, booking conflicts |
| **7. Data Transformation** | Service/DTO | Transform for storage | Password hashing, date parsing |
| **8. Database Validation** | Mongoose schemas | Schema-level constraints | Required fields, unique indexes |
| **9. Output Transformation** | Service/Controller | Shape response | Remove `passwordHash`, format dates |

### 5.3 Real-Time Data Flow (Socket.io)

```
Flutter App                Socket.io Server              MongoDB
    │                           │                           │
    │  1. Connect               │                           │
    │  (JWT in handshake)       │                           │
    │──────────────────────────>│                           │
    │                           │  Verify JWT               │
    │                           │  Extract userId           │
    │                           │  Join room(userId)        │
    │  2. Connected             │                           │
    │<──────────────────────────│                           │
    │                           │                           │
    │  3. join_room(chatId)     │                           │
    │──────────────────────────>│                           │
    │                           │  Validate participation  │
    │                           │──────────────────────────>│
    │                           │  ChatRoom.findById()     │
    │                           │<──────────────────────────│
    │                           │  socket.join(chatId)     │
    │  4. joined_room           │                           │
    │<──────────────────────────│                           │
    │                           │                           │
    │  5. send_message          │                           │
    │  { chatId, content }      │                           │
    │──────────────────────────>│                           │
    │                           │  ChatService.sendMessage()│
    │                           │──────────────────────────>│
    │                           │  Message.create()        │
    │                           │  ChatRoom.save()         │
    │                           │<──────────────────────────│
    │                           │                           │
    │  message_sent (ack)       │                           │
    │<──────────────────────────│                           │
    │                           │                           │
    │  receive_message          │                           │
    │  (to all in room)         │                           │
    │<──────────────────────────│──> Other participants     │
```

---

## 6. Database Architecture

### 6.1 MongoDB Collections

LearnMentor uses **MongoDB** as its primary database via the **Mongoose ODM**. The application connects to MongoDB through a URI specified in the `MONGO_URI` environment variable.

| Collection | Schema/Model | Description |
|-----------|-------------|-------------|
| `users` | `User` | User accounts (students, tutors, admins) |
| `refreshtokens` | `RefreshToken` | JWT refresh token hashes |
| `passwordresettokens` | `PasswordResetToken` | Password reset token hashes |
| `tutorprofiles` | `TutorProfile` | Extended tutor profiles (bio, rate, subjects) |
| `availabilityslots` | `AvailabilitySlot` | Tutor time slot availability |
| `bookings` | `Booking` | Session booking records |
| `transactions` | `Transaction` | Payment transaction records |
| `chatrooms` | `ChatRoom` | Chat conversation metadata |
| `messages` | `Message` | Individual chat messages |
| `reviews` | `Review` | Tutor reviews and ratings |
| `notifications` | `Notification` | In-app notification records |
| `announcements` | `Announcement` | Admin broadcast announcements |
| `studyresources` | `StudyResource` | Uploaded study materials metadata |
| `jobs` | `Job` | Job/task records (secondary) |

### 6.2 Indexes & Performance Optimizations

**Users Collection:**
```
{ role: 1 }                           — Role-based filtering
{ email: 1 }                          — Unique, login lookup
```

**Refresh Tokens:**
```
{ userId: 1 }                         — User token lookup
{ expiresAt: 1 }                      — Expired token cleanup
```

**Password Reset Tokens:**
```
{ userId: 1 }                         — User token lookup
{ tokenHash: 1 }                      — Token verification
{ expiresAt: 1 }                      — Expired token cleanup
```

**Tutor Profiles:**
```
{ user: 1 }                           — Unique, user lookup
{ verificationStatus: 1 }             — Status filtering
{ hourlyRate: 1 }                     — Price range filtering
{ subjects: 1 }                       — Subject search
{ languages: 1 }                      — Language filtering
{ rating: -1 }                        — Rating sort (descending)
```

**Availability Slots:**
```
{ tutorId: 1, startTime: 1 }          — Tutor schedule lookup
{ isBooked: 1, startTime: 1 }         — Available slot filtering
```

**Bookings:**
```
{ student: 1, status: 1 }             — Student booking queries
{ tutor: 1, status: 1 }               — Tutor booking queries
{ tutor: 1, startTime: 1, endTime: 1 } — Double-booking check
{ status: 1 }                         — Status filtering
{ createdAt: -1 }                     — Recent bookings sort
```

**Chat Rooms:**
```
{ student: 1, isActive: 1 }           — Student chat lookup
{ tutor: 1, isActive: 1 }             — Tutor chat lookup
{ student: 1, tutor: 1, booking: 1 }  — Unique compound (sparse)
```

**Messages:**
```
{ chatRoom: 1, createdAt: -1 }        — Message pagination
```

**Reviews:**
```
{ tutor: 1 }                          — Tutor review lookup
{ student: 1 }                        — Student review lookup
{ booking: 1 }                        — Unique per booking
```

**Notifications:**
```
{ recipient: 1 }                      — User notification lookup
{ recipient: 1, isRead: 1 }           — Unread count query
{ createdAt: -1 }                     — Recent notifications sort
```

**Transactions:**
```
{ sender: 1 }                         — Sent payment history
{ receiver: 1 }                       — Received payment history
{ job: 1 }                            — Job payment lookup
{ transactionUuid: 1 }                — Unique transaction ID
```

**Study Resources:**
```
{ category: 1, isPublic: 1 }          — Category filtering
{ tutor: 1 }                          — Tutor resource lookup
```

### 6.3 Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────┐
│     Users        │────1:1──│  TutorProfiles   │
│─────────────────│         │──────────────────│
│ _id (ObjectId)  │         │ _id              │
│ email           │         │ user → Users._id │
│ passwordHash    │         │ bio              │
│ role (ENUM)     │         │ hourlyRate       │
│ fullName        │         │ subjects[]       │
│ phone           │         │ languages[]      │
│ isVerified      │         │ verificationStat.│
│ isActive        │         │ averageRating    │
│ profileImage    │         │ totalReviews     │
│ balance         │         └──────────────────┘
│ theme           │                  │
└────────┬────────┘                  │ 1:N
         │                           │
         │ 1:N              ┌────────┴────────┐
         │                  │AvailabilitySlots│
         │                  │─────────────────│
         │                  │ tutorId→Users   │
         │                  │ startTime       │
         │                  │ endTime         │
         │                  │ isBooked        │
         │                  └─────────────────┘
         │
    ┌────┴────────────────────────────────┐
    │              │              │        │
    │ 1:N          │ 1:N          │ 1:N    │ 1:N
    ▼              ▼              ▼        ▼
┌────────┐  ┌──────────┐  ┌────────┐ ┌──────────┐
│Bookings│  │ChatRooms │  │Reviews │ │Notific.  │
│--------│  │----------│  │--------│ │----------│
│student │  │student   │  │booking │ │recipient │
│tutor   │  │tutor     │  │tutor   │ │sender    │
│status  │  │booking   │  │student │ │type      │
│price   │  │isActive  │  │rating  │ │message   │
│payment │  │lastMsg   │  │comment │ │isRead    │
│Status  │  └────┬─────┘  └────────┘ └──────────┘
└───┬────┘       │
    │            │ 1:N
    │            ▼
    │      ┌──────────┐
    │      │ Messages  │
    │      │──────────│
    │      │ chatRoom │
    │      │ sender   │
    │      │ message  │
    │      │ isRead   │
    │      └──────────┘
    │
    │ 1:1
    ▼
┌──────────────┐
│ Transactions │
│──────────────│
│ booking      │
│ job          │
│ sender       │
│ receiver     │
│ amount       │
│ commission   │
│ receiverAmt  │
│ status       │
└──────────────┘

┌──────────────┐    ┌──────────────┐
│Announcements │    │StudyResources│
│──────────────│    │──────────────│
│ title        │    │ title        │
│ content      │    │ category     │
│ targetRole   │    │ type         │
│ type         │    │ url          │
│ createdBy    │    │ tutor        │
│ expiresAt    │    │ isPublic     │
└──────────────┘    └──────────────┘
```

---

## 7. Deployment & Environment Configuration

### 7.1 Server Environment

| Component | Specification |
|-----------|--------------|
| **Runtime** | Node.js 20.x+ |
| **Language** | TypeScript 5.9.x (compiled to ES2020) |
| **Module System** | CommonJS |
| **Default Port** | 4000 |
| **Process Manager** | Node.js (production), ts-node-dev (development) |
| **HTTP Server** | Express.js 4.x with http.createServer wrapper |
| **WebSocket** | Socket.io mounted on same HTTP server |

### 7.2 Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ──────────────────────── Server ────────────────────────
NODE_ENV=development                    # development | production | test
PORT=4000                               # Server port

# ──────────────────────── Database ──────────────────────
MONGO_URI=mongodb://localhost:27017/learnmentor   # MongoDB connection string

# ──────────────────── Authentication ────────────────────
JWT_ACCESS_SECRET=your-access-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_SECRET=fallback-secret                        # Fallback for both

# ───────────────────── Admin Seed ───────────────────────
ADMIN_EMAIL=admin@learnmentor.com
ADMIN_PASSWORD=Admin@123

# ──────────────────── Cloudinary ────────────────────────
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ────────────────────── Email ───────────────────────────
MAIL_HOST=smtp.gmail.com                # SMTP host
MAIL_PORT=587                           # SMTP port
MAIL_SECURE=false                       # true for port 465
MAIL_USER=your-email@gmail.com          # SMTP username
MAIL_PASS=your-app-password             # SMTP password/app password
MAIL_FROM="LearnMentor" <support@learnmentor.com>

# ──────────────────────── CORS ──────────────────────────
CORS_ORIGIN=http://localhost:3000       # Allowed frontend origins

# ────────────────────── Frontend ────────────────────────
FRONTEND_URL=http://localhost:3000      # For password reset links

# ──── PostgreSQL (Legacy/Alternative - defined but MongoDB primary) ────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=learnmentor
DB_USER=postgres
DB_PASSWORD=postgres
```

### 7.3 Database Configuration

**Primary Database: MongoDB**

```typescript
// src/config/db.ts
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
};
```

**Connection Features:**
- Mongoose ODM with schema validation
- Automatic timestamp management (`createdAt`, `updatedAt`)
- Document transformation (password hash removal in JSON output)
- Index creation for query performance

**Alternative Database Configuration (PostgreSQL - schema only):**

The project includes a PostgreSQL schema (`database/schema.sql`) and connection pool (`src/config/database.ts`) as an alternative/legacy configuration, but the active application uses MongoDB through Mongoose.

### 7.4 Production vs Development Setup

| Aspect | Development | Production |
|--------|-------------|------------|
| **Start Command** | `npm run dev` (ts-node-dev with hot reload) | `npm run build && npm start` (compiled JS) |
| **Error Details** | Stack traces in API responses | Generic error messages only |
| **Email Service** | Ethereal fake SMTP (preview URLs) | Real SMTP provider (Gmail, etc.) |
| **Password Reset** | Reset link and token logged to console | Token sent via email only |
| **Rate Limits** | Relaxed for testing | Strict enforcement |
| **CORS** | Multiple localhost ports allowed | Specific production domains |
| **Logging** | Full request/response logging | Structured production logging |
| **JWT Secrets** | Default fallback keys | Strong environment-specific secrets |
| **Database** | Local MongoDB instance | Cloud MongoDB (Atlas) recommended |

**Build & Deployment Commands:**

```bash
# Development
npm run dev                    # Start with hot-reload (ts-node-dev)

# Production Build
npm run build                  # Compile TypeScript → dist/
npm start                      # Run compiled JavaScript (node dist/server.js)

# Testing
npm test                       # Run Jest test suite
```

**Startup Sequence:**
1. Load environment variables (`dotenv.config()`)
2. Connect to MongoDB (`connectDB()`)
3. Seed admin user (`seedAdmin()`)
4. Create HTTP server (`http.createServer(app)`)
5. Initialize Socket.io (`initSocket(server)`)
6. Start listening on configured port

---

## 8. Error Handling Strategy

LearnMentor implements a **multi-layer error handling** strategy:

### Layer 1: Input Validation Errors (Zod)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```
**HTTP Status:** 400 Bad Request

### Layer 2: Business Logic Errors (Service Layer)

```json
{
  "success": false,
  "message": "Email already exists"
}
```
**HTTP Status:** 400/401/403/404 (context-dependent)

### Layer 3: Authentication/Authorization Errors (Middleware)

```json
{
  "success": false,
  "message": "No token provided. Please login."
}
```
**HTTP Status:** 401 Unauthorized / 403 Forbidden

### Layer 4: Global Error Handler (Centralized)

The centralized `errorHandler` middleware catches all unhandled errors:

```typescript
// Development response (includes stack trace)
{
  "success": false,
  "message": "Internal Server Error",
  "stack": "Error: ...\n    at ...",
  "error": { /* full error object */ }
}

// Production response (minimal info)
{
  "success": false,
  "message": "Internal Server Error"
}
```
**HTTP Status:** 500 Internal Server Error

### Layer 5: 404 Not Found Handler

```json
{
  "success": false,
  "message": "Route /api/unknown not found"
}
```
**HTTP Status:** 404 Not Found

### Error Propagation Chain
```
Controller
  └── try/catch → Send specific HTTP error response
       └── Unhandled errors bubble up to global errorHandler
            └── Development: full error details
            └── Production: generic message
```

---

## 9. API Response Structure Standards

All API responses follow a consistent JSON structure:

### Success Responses

```json
// Single resource
{
  "success": true,
  "message": "Operation completed successfully",
  "user": { /* resource object */ }
}

// Collection with pagination
{
  "success": true,
  "tutors": [ /* array of resources */ ],
  "total": 50,
  "page": 1,
  "totalPages": 5
}

// Action confirmation
{
  "success": true,
  "message": "Booking created successfully"
}
```

### Error Responses

```json
// Validation error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}

// Business logic error
{
  "success": false,
  "message": "Email already exists"
}

// Authentication error
{
  "success": false,
  "message": "Token expired. Please refresh your token or login again."
}
```

### HTTP Status Code Usage

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (new resource) |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing/invalid/expired token |
| 403 | Forbidden | Insufficient permissions, deactivated account |
| 404 | Not Found | Resource not found, invalid route |
| 409 | Conflict | Double-booking, duplicate resource |
| 500 | Internal Server Error | Unexpected server errors |

---

> **End of Technical Documentation**  
> This document provides a comprehensive overview of the LearnMentor backend system architecture, module implementations, security mechanisms, and deployment configurations. For API testing, refer to the included Postman collections (`LearnMentor-Profile-API.postman_collection.json` and `MVP_Features_Testing.postman_collection.json`).
