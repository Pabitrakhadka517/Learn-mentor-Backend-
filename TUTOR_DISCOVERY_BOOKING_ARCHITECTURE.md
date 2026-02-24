# Student Tutor Discovery & Booking - Clean Architecture Design

## Overview

This document outlines the complete clean architecture design for the **Student Tutor Discovery & Booking Workflow**. The system enables students to discover tutors, book sessions, make payments, engage in real-time chat, and submit reviews through a comprehensive multi-module architecture.

## Architecture Layers

### 1. Presentation Layer (Controllers + Routes + Middleware)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│   Controllers   │     Routes      │   Middleware    │ Websocket │
│                 │                 │                 │  Gateway  │
│ • TutorCtrl     │ • /api/tutors   │ • authenticate  │ • Chat    │
│ • BookingCtrl   │ • /api/bookings │ • authorizeRole │ • Notifications │
│ • TransactionCtrl│• /api/transactions│• validate     │ • Real-time │
│ • ChatCtrl      │ • /api/chat     │ • rateLimiting  │   Updates │
│ • ReviewCtrl    │ • /api/reviews  │ • errorHandler  │           │
│ • NotificationCtrl│• /api/notifications│           │             │
└─────────────────┴─────────────────┴─────────────────┴───────────┘
```

### 2. Application Layer (Use Cases + DTOs + Interfaces)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│   Use Cases     │      DTOs       │   Interfaces    │ Event Bus │
│                 │                 │                 │           │
│ • SearchTutors  │ • SearchFilter  │ • ITutorRepo    │ • Booking │
│ • CreateBooking │ • BookingCreate │ • IBookingRepo  │   Events  │
│ • ProcessPayment│ • PaymentDTO    │ • ITransactionRepo│ • Payment │
│ • SendMessage   │ • MessageDTO    │ • IChatRepo     │   Events  │
│ • SubmitReview  │ • ReviewDTO     │ • IReviewRepo   │ • Chat    │
│ • SendNotification│• NotificationDTO│• INotificationRepo│ Events │
└─────────────────┴─────────────────┴─────────────────┴───────────┘
```

### 3. Domain Layer (Entities + Business Rules)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Domain Layer                               │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│    Entities     │ Business Rules  │ Domain Services │   Events  │
│                 │                 │                 │           │
│ • Tutor         │ • Availability  │ • PriceCalculator│ • BookingCreated │
│ • Booking       │ • DoubleBooking │ • CommissionCalc │ • PaymentCompleted │
│ • Transaction   │ • PaymentRules  │ • RatingAggregator│ • MessageSent │
│ • ChatRoom      │ • ReviewRules   │ • NotificationBuilder│ • ReviewSubmitted │
│ • Message       │ • AuthRules     │ • ConflictDetector│           │
│ • Review        │ • ValidationRules│               │             │
│ • Notification  │                 │                 │           │
└─────────────────┴─────────────────┴─────────────────┴───────────┘
```

### 4. Infrastructure Layer (Repositories + External Services)

```
┌─────────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                           │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│  Repositories   │  Data Models    │ External Services│ Real-time │
│                 │                 │                 │           │
│ • TutorRepo     │ • TutorModel    │ • PaymentGateway│ • Socket.io│
│ • BookingRepo   │ • BookingModel  │ • EmailService  │ • Redis   │
│ • TransactionRepo│• TransactionModel│• SMSService   │ • Event   │
│ • ChatRepo      │ • ChatModel     │ • FileStorage   │   Store   │
│ • ReviewRepo    │ • ReviewModel   │ • LoggingService│           │
│ • NotificationRepo│• NotificationModel│             │           │
└─────────────────┴─────────────────┴─────────────────┴───────────┘
```

## Module Structure

### Core Modules Organization

```
src/modules/
├── tutor/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── tutor.entity.ts
│   │   │   ├── tutor-profile.entity.ts
│   │   │   └── availability-slot.entity.ts
│   │   ├── interfaces/
│   │   │   ├── tutor.repository.interface.ts
│   │   │   └── tutor.service.interface.ts
│   │   └── services/
│   │       ├── tutor-search.service.ts
│   │       └── availability.service.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── search-tutors.dto.ts
│   │   │   ├── tutor-profile.dto.ts
│   │   │   └── availability.dto.ts
│   │   └── use-cases/
│   │       ├── search-tutors.usecase.ts
│   │       ├── get-tutor-profile.usecase.ts
│   │       └── check-availability.usecase.ts
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   └── tutor.repository.impl.ts
│   │   └── services/
│   │       └── tutor-aggregation.service.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   └── tutor.controller.ts
│   │   ├── routes/
│   │   │   └── tutor.routes.ts
│   │   └── middleware/
│   │       └── tutor.validation.ts
│   └── tutor.module.ts
│
├── booking/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── booking.entity.ts
│   │   │   └── booking-session.entity.ts
│   │   ├── interfaces/
│   │   │   └── booking.repository.interface.ts
│   │   └── services/
│   │       ├── double-booking-prevention.service.ts
│   │       └── session-management.service.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── booking-details.dto.ts
│   │   │   └── booking-status.dto.ts
│   │   └── use-cases/
│   │       ├── create-booking.usecase.ts
│   │       ├── cancel-booking.usecase.ts
│   │       ├── complete-booking.usecase.ts
│   │       └── get-booking-history.usecase.ts
│   ├── infrastructure/
│   │   └── repositories/
│   │       └── booking.repository.impl.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   └── booking.controller.ts
│   │   ├── routes/
│   │   │   └── booking.routes.ts
│   │   └── middleware/
│   │       └── booking.validation.ts
│   └── booking.module.ts
│
├── transaction/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── transaction.entity.ts
│   │   │   └── commission.entity.ts
│   │   ├── interfaces/
│   │   │   └── transaction.repository.interface.ts
│   │   └── services/
│   │       ├── payment-processing.service.ts
│   │       └── commission-calculation.service.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── payment-request.dto.ts
│   │   │   ├── transaction-details.dto.ts
│   │   │   └── commission-breakdown.dto.ts
│   │   └── use-cases/
│   │       ├── process-payment.usecase.ts
│   │       ├── calculate-commission.usecase.ts
│   │       └── refund-payment.usecase.ts
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   └── transaction.repository.impl.ts
│   │   └── services/
│   │       └── payment-gateway.service.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   └── transaction.controller.ts
│   │   └── routes/
│   │       └── transaction.routes.ts
│   └── transaction.module.ts
│
├── chat/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── chat-room.entity.ts
│   │   │   └── message.entity.ts
│   │   ├── interfaces/
│   │   │   ├── chat.repository.interface.ts
│   │   │   └── real-time.service.interface.ts
│   │   └── services/
│   │       └── message-validation.service.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── send-message.dto.ts
│   │   │   ├── chat-room.dto.ts
│   │   │   └── message-history.dto.ts
│   │   └── use-cases/
│   │       ├── create-chat-room.usecase.ts
│   │       ├── send-message.usecase.ts
│   │       └── get-chat-history.usecase.ts
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   └── chat.repository.impl.ts
│   │   └── services/
│   │       └── socket.service.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   └── chat.controller.ts
│   │   ├── routes/
│   │   │   └── chat.routes.ts
│   │   └── websocket/
│   │       └── chat.gateway.ts
│   └── chat.module.ts
│
├── review/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── review.entity.ts
│   │   ├── interfaces/
│   │   │   └── review.repository.interface.ts
│   │   └── services/
│   │       └── rating-aggregation.service.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── submit-review.dto.ts
│   │   │   └── review-summary.dto.ts
│   │   └── use-cases/
│   │       ├── submit-review.usecase.ts
│   │       └── get-tutor-reviews.usecase.ts
│   ├── infrastructure/
│   │   └── repositories/
│   │       └── review.repository.impl.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   └── review.controller.ts
│   │   └── routes/
│   │       └── review.routes.ts
│   └── review.module.ts
│
└── notification/
    ├── domain/
    │   ├── entities/
    │   │   ├── notification.entity.ts
    │   │   └── notification-template.entity.ts
    │   ├── interfaces/
    │   │   └── notification.repository.interface.ts
    │   └── services/
    │       └── notification-builder.service.ts
    ├── application/
    │   ├── dto/
    │   │   ├── notification.dto.ts
    │   │   └── notification-preferences.dto.ts
    │   └── use-cases/
    │       ├── send-notification.usecase.ts
    │       └── get-notifications.usecase.ts
    ├── infrastructure/
    │   ├── repositories/
    │   │   └── notification.repository.impl.ts
    │   └── services/
    │       ├── email.service.ts
    │       ├── sms.service.ts
    │       └── push-notification.service.ts
    ├── presentation/
    │   ├── controllers/
    │   │   └── notification.controller.ts
    │   ├── routes/
    │   │   └── notification.routes.ts
    │   └── websocket/
    │       └── notification.gateway.ts
    └── notification.module.ts
```

## Data Flow Architecture

### 1. Request-Response Flow

```
Client Request
     ↓
┌─────────────────┐
│   Middleware    │ ← authenticate, authorize, validate, rate-limit
│                 │
└─────────────────┘
     ↓
┌─────────────────┐
│   Controller    │ ← HTTP request handling, response formatting
│                 │
└─────────────────┘
     ↓
┌─────────────────┐
│   Use Case      │ ← Business logic orchestration
│                 │
└─────────────────┘
     ↓
┌─────────────────┐
│ Domain Service  │ ← Complex business rules
│                 │
└─────────────────┘
     ↓
┌─────────────────┐
│   Repository    │ ← Data access abstraction
│                 │
└─────────────────┘
     ↓
┌─────────────────┐
│   Database      │ ← MongoDB persistence
│                 │
└─────────────────┘
```

### 2. Event-Driven Flow

```
Domain Event Triggered
     ↓
┌─────────────────┐
│  Event Handler  │ ← Process domain events
│                 │
└─────────────────┘
     ↓
┌─────────────────┐
│ Notification    │ ← Generate notifications
│   Service       │
└─────────────────┘
     ↓
┌─────────────────┐
│  Socket.io      │ ← Real-time delivery
│  Gateway        │
└─────────────────┘
     ↓
┌─────────────────┐
│    Client       │ ← Real-time updates
│                 │
└─────────────────┘
```

## API Endpoint Design

### Tutor Discovery Module

```http
# Search and filter tutors
GET /api/tutors
Query Parameters:
  - subject: string[]
  - minRate: number
  - maxRate: number  
  - rating: number
  - availability: date
  - location: string
  - page: number
  - limit: number

Response:
{
  "success": true,
  "data": {
    "tutors": [...],
    "pagination": {...},
    "filters": {...}
  }
}

# Get tutor profile
GET /api/tutors/:id
Response:
{
  "success": true,
  "data": {
    "profile": {...},
    "availability": [...],
    "reviews": [...],
    "rating": number
  }
}

# Get tutor availability
GET /api/tutors/:id/availability
Query: startDate, endDate
Response:
{
  "success": true,
  "data": {
    "slots": [...]
  }
}
```

### Booking Module

```http
# Create booking
POST /api/bookings/book
Body:
{
  "tutorId": "string",
  "startTime": "ISO Date",
  "endTime": "ISO Date",
  "subject": "string",
  "notes": "string"
}

Response:
{
  "success": true,
  "data": {
    "booking": {...},
    "paymentRequired": true,
    "amount": number
  }
}

# Get booking details
GET /api/bookings/:id
Response:
{
  "success": true,
  "data": {
    "booking": {...},
    "tutor": {...},
    "student": {...},
    "transaction": {...}
  }
}

# Complete booking session
PATCH /api/bookings/:id/complete
Body:
{
  "sessionNotes": "string",
  "actualDuration": number
}
```

### Transaction Module

```http
# Initialize payment for booking
GET /api/transactions/bookings/transaction/:bookingId
Response:
{
  "success": true,
  "data": {
    "transactionId": "string",
    "amount": number,
    "commission": number,
    "tutorAmount": number,
    "paymentMethods": [...]
  }
}

# Process payment
POST /api/transactions/bookings/transaction/:transactionId/pay
Body:
{
  "paymentMethod": "string",
  "paymentDetails": {...}
}

Response:
{
  "success": true,
  "data": {
    "transaction": {...},
    "booking": {...},
    "chatRoom": {...}
  }
}
```

### Chat Module

```http
# Get chat rooms for user
GET /api/chat/rooms
Response:
{
  "success": true,
  "data": {
    "rooms": [...]
  }
}

# Get chat history
GET /api/chat/rooms/:roomId/messages
Query: page, limit, before, after
Response:
{
  "success": true,
  "data": {
    "messages": [...],
    "pagination": {...}
  }
}

# WebSocket Events
join_room: { roomId: string }
send_message: { roomId: string, content: string, type: "text|image|file" }
receive_message: { message: {...}, sender: {...} }
typing: { roomId: string, userId: string }
```

### Review Module

```http
# Submit review
POST /api/reviews/:bookingId
Body:
{
  "rating": number, // 1-5
  "comment": "string",
  "tags": string[]
}

Response:
{
  "success": true,
  "data": {
    "review": {...},
    "tutorRating": {...}
  }
}

# Get tutor reviews
GET /api/reviews/tutor/:tutorId
Query: page, limit, rating
Response:
{
  "success": true,
  "data": {
    "reviews": [...],
    "summary": {...}
  }
}
```

### Notification Module

```http
# Get user notifications
GET /api/notifications
Query: unread, type, page, limit
Response:
{
  "success": true,
  "data": {
    "notifications": [...],
    "unreadCount": number
  }
}

# Mark notification as read
PATCH /api/notifications/:id/read
Response:
{
  "success": true,
  "message": "Notification marked as read"
}

# WebSocket Events
notification: { notification: {...} }
```

## Database Schema Design

### MongoDB Collections

```javascript
// users collection
{
  _id: ObjectId,
  fullName: String,
  email: String,
  role: String, // STUDENT, TUTOR, ADMIN
  profileImage: String,
  createdAt: Date,
  updatedAt: Date
}

// tutorprofiles collection
{
  _id: ObjectId,
  user: ObjectId, // ref: users
  subjects: [String],
  hourlyRate: Number,
  bio: String,
  experience: Number,
  education: String,
  certifications: [String],
  languages: [String],
  verificationStatus: String, // PENDING, VERIFIED, REJECTED
  averageRating: Number,
  totalReviews: Number,
  totalSessions: Number,
  isAvailable: Boolean,
  location: {
    type: String, // online, in-person, both
    city: String,
    coordinates: [Number, Number]
  },
  createdAt: Date,
  updatedAt: Date
}

// availabilityslots collection
{
  _id: ObjectId,
  tutor: ObjectId, // ref: tutorprofiles
  startTime: Date,
  endTime: Date,
  isRecurring: Boolean,
  recurringPattern: {
    type: String, // weekly, monthly
    daysOfWeek: [Number], // 0=Sunday, 1=Monday, etc
    endDate: Date
  },
  isBooked: Boolean,
  createdAt: Date
}

// bookings collection
{
  _id: ObjectId,
  student: ObjectId, // ref: users
  tutor: ObjectId, // ref: users
  tutorProfile: ObjectId, // ref: tutorprofiles
  subject: String,
  startTime: Date,
  endTime: Date,
  duration: Number, // minutes
  hourlyRate: Number,
  totalAmount: Number,
  status: String, // PENDING, CONFIRMED, PAID, ONGOING, COMPLETED, CANCELLED
  paymentStatus: String, // UNPAID, PAID, REFUNDED
  sessionNotes: String,
  studentNotes: String,
  actualStartTime: Date,
  actualEndTime: Date,
  actualDuration: Number,
  createdAt: Date,
  updatedAt: Date
}

// transactions collection
{
  _id: ObjectId,
  booking: ObjectId, // ref: bookings
  student: ObjectId, // ref: users
  tutor: ObjectId, // ref: users
  type: String, // BOOKING_PAYMENT, REFUND, COMMISSION
  amount: Number,
  platformCommission: Number, // 10%
  tutorAmount: Number, // 90%
  paymentMethod: String,
  paymentDetails: Object,
  status: String, // PENDING, COMPLETED, FAILED, REFUNDED
  transactionId: String, // external payment gateway ID
  paymentGateway: String,
  createdAt: Date,
  updatedAt: Date
}

// chatrooms collection
{
  _id: ObjectId,
  booking: ObjectId, // ref: bookings
  participants: [ObjectId], // ref: users [student, tutor]
  type: String, // booking_chat, support_chat
  status: String, // active, archived
  lastMessage: {
    content: String,
    sender: ObjectId,
    timestamp: Date
  },
  createdAt: Date,
  updatedAt: Date
}

// messages collection
{
  _id: ObjectId,
  chatRoom: ObjectId, // ref: chatrooms
  sender: ObjectId, // ref: users
  content: String,
  type: String, // text, image, file, system
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  readBy: [{
    user: ObjectId,
    readAt: Date
  }],
  editedAt: Date,
  deletedAt: Date,
  createdAt: Date
}

// reviews collection
{
  _id: ObjectId,
  booking: ObjectId, // ref: bookings
  student: ObjectId, // ref: users
  tutor: ObjectId, // ref: users
  rating: Number, // 1-5
  comment: String,
  tags: [String], // helpful, patient, knowledgeable, etc
  response: { // tutor response
    comment: String,
    createdAt: Date
  },
  isAnonymous: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// notifications collection
{
  _id: ObjectId,
  recipient: ObjectId, // ref: users
  type: String, // booking_created, payment_success, message_received, etc
  title: String,
  message: String,
  data: Object, // additional context data
  isRead: Boolean,
  readAt: Date,
  channels: [String], // push, email, sms, in_app
  deliveryStatus: Object,
  expiresAt: Date,
  createdAt: Date
}
```

### Database Indexes

```javascript
// Performance optimization indexes
db.tutorprofiles.createIndex({ "subjects": 1 })
db.tutorprofiles.createIndex({ "averageRating": -1 })
db.tutorprofiles.createIndex({ "hourlyRate": 1 })
db.tutorprofiles.createIndex({ "location.coordinates": "2dsphere" })
db.tutorprofiles.createIndex({ "verificationStatus": 1, "isAvailable": 1 })

db.availabilityslots.createIndex({ "tutor": 1, "startTime": 1, "endTime": 1 })
db.availabilityslots.createIndex({ "startTime": 1, "endTime": 1 })
db.availabilityslots.createIndex({ "isBooked": 1 })

db.bookings.createIndex({ "student": 1, "createdAt": -1 })
db.bookings.createIndex({ "tutor": 1, "createdAt": -1 })
db.bookings.createIndex({ "status": 1 })
db.bookings.createIndex({ "startTime": 1, "endTime": 1 })
db.bookings.createIndex({ "tutor": 1, "startTime": 1, "endTime": 1 }) // double-booking prevention

db.transactions.createIndex({ "booking": 1 })
db.transactions.createIndex({ "student": 1, "createdAt": -1 })
db.transactions.createIndex({ "tutor": 1, "createdAt": -1 })
db.transactions.createIndex({ "status": 1 })

db.messages.createIndex({ "chatRoom": 1, "createdAt": -1 })
db.messages.createIndex({ "sender": 1, "createdAt": -1 })

db.reviews.createIndex({ "tutor": 1, "createdAt": -1 })
db.reviews.createIndex({ "booking": 1 })
db.reviews.createIndex({ "rating": 1 })

db.notifications.createIndex({ "recipient": 1, "createdAt": -1 })
db.notifications.createIndex({ "recipient": 1, "isRead": 1 })
db.notifications.createIndex({ "expiresAt": 1 })
```

## Business Logic & Rules

### Tutor Discovery Logic

```typescript
// Search & Filtering Rules
interface SearchLogic {
  subjectMatching: {
    exactMatch: boolean;
    similarSubjects: boolean;
    relatedFields: boolean;
  };
  
  rateFiltering: {
    minRate: number;
    maxRate: number;
    currency: string;
  };
  
  availabilityFilter: {
    dateRange: DateRange;
    timeSlots: TimeSlot[];
    timezone: string;
  };
  
  locationFilter: {
    type: 'online' | 'in-person' | 'both';
    radius?: number; // for in-person
    coordinates?: [number, number];
  };
  
  sortingOptions: {
    rating: 'asc' | 'desc';
    price: 'asc' | 'desc';
    experience: 'asc' | 'desc';
    availability: 'nearest-first';
  };
}

// Rating Aggregation Logic
interface RatingLogic {
  calculateAverage: (reviews: Review[]) => number;
  weightedRating: (reviews: Review[], weights: RatingWeights) => number;
  confidenceInterval: (rating: number, reviewCount: number) => ConfidenceScore;
}
```

### Booking Business Rules

```typescript
// Booking Creation Rules
interface BookingRules {
  timeValidation: {
    minimumAdvanceBooking: number; // hours
    maximumAdvanceBooking: number; // days
    minimumSessionDuration: number; // minutes
    maximumSessionDuration: number; // minutes
    bufferTime: number; // minutes between sessions
  };
  
  doubleBookingPrevention: {
    checkStudentConflicts: boolean;
    checkTutorConflicts: boolean;
    allowOverlapping: boolean;
    bufferMinutes: number;
  };
  
  cancellationPolicy: {
    freeCancellationWindow: number; // hours
    cancellationFeePercentage: number;
    refundProcessingTime: number; // days
  };
  
  reschedulingRules: {
    allowedAttempts: number;
    minimumNotice: number; // hours
    maxReschedulesPerBooking: number;
  };
}

// Status Transitions
enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED', 
  PAID = 'PAID',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

const statusTransitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PAID', 'CANCELLED'], 
  PAID: ['ONGOING', 'CANCELLED'],
  ONGOING: ['COMPLETED'],
  COMPLETED: [], // terminal state
  CANCELLED: [] // terminal state
};
```

### Payment Processing Rules

```typescript
// Commission Calculation
interface PaymentRules {
  platformCommission: {
    percentage: 10; // 10% platform fee
    minimumFee: number;
    maximumFee?: number;
  };
  
  paymentFlow: {
    holdPeriod: number; // days to hold payment
    releaseConditions: ReleaseCondition[];
    disputePeriod: number; // days
  };
  
  refundPolicy: {
    fullRefundWindow: number; // hours before session
    partialRefundPercentage: number;
    noRefundWindow: number; // hours before session
    processingTime: number; // days
  };
  
  tutorPayout: {
    minimumBalance: number;
    payoutFrequency: 'daily' | 'weekly' | 'monthly';
    payoutMethods: PayoutMethod[];
  };
}
```

## Real-Time Communication Architecture

### WebSocket Event System

```typescript
// Socket.io Event Structure
interface SocketEvents {
  // Chat Events
  'join_room': (data: { roomId: string }) => void;
  'leave_room': (data: { roomId: string }) => void;
  'send_message': (data: SendMessageData) => void;
  'receive_message': (data: MessageData) => void;
  'typing_start': (data: { roomId: string, userId: string }) => void;
  'typing_stop': (data: { roomId: string, userId: string }) => void;
  'user_online': (data: { userId: string }) => void;
  'user_offline': (data: { userId: string }) => void;
  
  // Notification Events
  'notification': (data: NotificationData) => void;
  'notification_read': (data: { notificationId: string }) => void;
  
  // Booking Events
  'booking_status_updated': (data: BookingUpdateData) => void;
  'session_started': (data: { bookingId: string }) => void;
  'session_ended': (data: { bookingId: string }) => void;
  
  // System Events
  'connection_established': () => void;
  'disconnect': () => void;
  'error': (error: SocketError) => void;
}

// Real-time Features
interface RealTimeFeatures {
  chat: {
    instantMessaging: boolean;
    typingIndicators: boolean;
    readReceipts: boolean;
    onlineStatus: boolean;
    messageDeliveryStatus: boolean;
  };
  
  notifications: {
    instantNotifications: boolean;
    customSounds: boolean;
    badgeCounts: boolean;
    pushNotifications: boolean;
  };
  
  booking: {
    liveStatusUpdates: boolean;
    sessionReminders: boolean;
    realTimeAvailability: boolean;
  };
}
```

### Event Broadcasting Strategy

```typescript
// Event Broadcasting Logic
interface EventBroadcast {
  userSpecific: {
    target: string; // userId
    events: UserEvent[];
  };
  
  roomBased: {
    target: string; // roomId
    events: RoomEvent[];
    participants: string[]; // userIds
  };
  
  roleBasedBroadcast: {
    target: UserRole[];
    events: SystemEvent[];
    filters: EventFilter[];
  };
  
  systemWide: {
    events: GlobalEvent[];
    excludeUsers?: string[];
  };
}
```

## Integration Points & Dependencies

### Module Interactions

```typescript
// Inter-module Dependencies
interface ModuleInteractions {
  tutorModule: {
    dependsOn: ['auth', 'notification'];
    provides: ['tutor-search', 'tutor-profile', 'availability'];
    events: ['tutor_updated', 'availability_changed'];
  };
  
  bookingModule: {
    dependsOn: ['tutor', 'auth', 'transaction', 'chat', 'notification'];
    provides: ['booking-management', 'session-tracking'];
    events: ['booking_created', 'booking_completed', 'booking_cancelled'];
  };
  
  transactionModule: {
    dependsOn: ['booking', 'auth'];
    provides: ['payment-processing', 'commission-calculation'];
    events: ['payment_completed', 'refund_processed'];
  };
  
  chatModule: {
    dependsOn: ['booking', 'auth'];
    provides: ['real-time-messaging', 'chat-history'];
    events: ['message_sent', 'room_created'];
  };
  
  reviewModule: {
    dependsOn: ['booking', 'auth'];
    provides: ['rating-system', 'review-management'];
    events: ['review_submitted', 'rating_updated'];
  };
  
  notificationModule: {
    dependsOn: ['auth'];
    provides: ['notification-delivery', 'alert-system'];
    events: ['notification_sent', 'notification_read'];
  };
}
```

### External Service Integrations

```typescript
// Third-party Service Integration
interface ExternalServices {
  paymentGateways: {
    stripe: StripeConfig;
    paypal: PayPalConfig;
    razorpay: RazorpayConfig;
  };
  
  communicationServices: {
    email: {
      provider: 'sendgrid' | 'ses' | 'mailgun';
      templates: EmailTemplateConfig;
    };
    sms: {
      provider: 'twilio' | 'sns';
      config: SMSConfig;
    };
    push: {
      provider: 'firebase' | 'apns' | 'onesignal';
      config: PushConfig;
    };
  };
  
  fileStorage: {
    provider: 'aws-s3' | 'cloudinary' | 'azure-blob';
    config: StorageConfig;
    allowedTypes: string[];
    maxFileSize: number;
  };
  
  analyticsAndMonitoring: {
    analytics: 'google-analytics' | 'mixpanel';
    monitoring: 'datadog' | 'newrelic' | 'sentry';
    logging: 'winston' | 'pino';
  };
}
```

## Complete User Journey Flow

### Student Tutor Discovery & Booking Journey

```
1. DISCOVERY PHASE
   ┌─────────────────┐
   │ Student starts  │ 
   │  tutor search   │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ GET /api/tutors │ ← filters: subject, rate, rating, availability
   │ (TutorController)│
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ SearchTutorsUC  │ ← business logic: filtering, sorting, aggregation
   │                 │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │  TutorRepo      │ ← MongoDB aggregation pipeline
   │                 │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ Return filtered │
   │ tutor profiles  │
   └─────────────────┘

2. PROFILE VIEW PHASE
   ┌─────────────────┐
   │ Student selects │
   │ specific tutor  │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │GET /api/tutors/ │
   │      :id        │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │GetTutorProfileUC│ ← get profile, reviews, availability
   │                 │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ Return detailed │
   │ tutor profile   │
   │ + availability  │
   └─────────────────┘

3. BOOKING CREATION PHASE
   ┌─────────────────┐
   │ Student selects │
   │  time slot &    │
   │ creates booking │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │POST /api/       │
   │bookings/book    │ ← validate time, check conflicts
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ CreateBookingUC │ ← business rules: double-booking prevention
   │                 │   price calculation, time validation
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ BookingRepo     │ ← create booking record (status: PENDING)
   │                 │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ NotificationSvc │ ← trigger BOOKING_CREATED event
   │                 │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ Return booking  │
   │ with payment    │
   │ requirements    │
   └─────────────────┘

4. PAYMENT INITIALIZATION
   ┌─────────────────┐
   │ Student proceeds│
   │  to payment     │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │GET /api/trans   │
   │actions/bookings/│ ← get payment details
   │transaction/:id  │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ CalculateCommis │ ← business logic: 10% platform fee
   │ sionUseCase     │   calculate tutor amount
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ Return payment  │
   │ breakdown &     │
   │ transaction ID  │
   └─────────────────┘

5. PAYMENT PROCESSING
   ┌─────────────────┐
   │ Student submits │
   │ payment details │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │POST /api/trans  │
   │actions/bookings/│ ← process payment
   │transaction/:tId │
   │/pay             │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ ProcessPaymentUC│ ← payment gateway integration
   │                 │   commission calculation
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ PaymentGateway  │ ← external payment processing
   │ Service         │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ Update booking  │ ← status: PENDING → PAID
   │ status & create │   create transaction record
   │ transaction     │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ CreateChatRoom  │ ← auto-create chat room
   │ UseCase         │   for student-tutor communication
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ NotificationSvc │ ← trigger PAYMENT_SUCCESS event
   │                 │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ Socket.io       │ ← real-time notification delivery
   │ Broadcasting    │
   └─────────────────┘

6. REAL-TIME CHAT PHASE
   ┌─────────────────┐
   │ Auto-created    │
   │ chat room       │
   │ available       │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ WebSocket       │ ← join_room event
   │ Connection      │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ Student/Tutor   │ ← send_message events
   │ exchange        │
   │ messages        │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ SendMessageUC   │ ← message validation, persistence
   │                 │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ ChatRepo        │ ← persist message in MongoDB
   │                 │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ Socket.io       │ ← real-time message delivery
   │ Broadcasting    │
   └─────────────────┘

7. SESSION COMPLETION
   ┌─────────────────┐
   │ Session time    │
   │ completed       │
   │ (manual/auto)   │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │PATCH /api/      │
   │bookings/:id     │ ← mark session complete
   │/complete        │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │CompleteBookingUC│ ← business logic: session validation
   │                 │   time tracking, status update
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ Update booking  │ ← status: PAID → COMPLETED
   │ status & record │   actual session duration
   │ session details │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ NotificationSvc │ ← trigger SESSION_COMPLETED event
   │                 │
   └─────────────────┘

8. REVIEW SUBMISSION
   ┌─────────────────┐
   │ Student submits │
   │ review &        │
   │ rating          │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │POST /api/       │
   │reviews/         │ ← validate review eligibility
   │:bookingId       │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ SubmitReviewUC  │ ← business rules: one review per booking
   │                 │   booking must be COMPLETED
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ ReviewRepo      │ ← create review record
   │                 │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │RatingAggregation│ ← recalculate tutor average rating
   │ Service         │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ Update tutor    │ ← update averageRating, totalReviews
   │ profile rating  │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ NotificationSvc │ ← trigger REVIEW_SUBMITTED event
   │                 │
   └─────────────────┘
            ↓
   ┌─────────────────┐
   │ Journey         │ ← Booking lifecycle completed
   │ Complete        │
   └─────────────────┘
```

## Error Handling Strategy

### Error Types & HTTP Status Codes

```typescript
// Standardized Error Response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

// Error Categories
enum ErrorTypes {
  // Validation Errors (400)
  INVALID_INPUT = 'INVALID_INPUT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Authentication Errors (401)
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  
  // Authorization Errors (403)
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  ROLE_NOT_AUTHORIZED = 'ROLE_NOT_AUTHORIZED',
  
  // Resource Errors (404)
  TUTOR_NOT_FOUND = 'TUTOR_NOT_FOUND',
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
  CHAT_ROOM_NOT_FOUND = 'CHAT_ROOM_NOT_FOUND',
  
  // Conflict Errors (409)
  DOUBLE_BOOKING_CONFLICT = 'DOUBLE_BOOKING_CONFLICT',
  TUTOR_UNAVAILABLE = 'TUTOR_UNAVAILABLE',
  BOOKING_ALREADY_PAID = 'BOOKING_ALREADY_PAID',
  REVIEW_ALREADY_EXISTS = 'REVIEW_ALREADY_EXISTS',
  
  // Payment Errors (402/400)
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',
  COMMISSION_CALCULATION_ERROR = 'COMMISSION_CALCULATION_ERROR',
  
  // Business Logic Errors (422)
  BOOKING_TIME_INVALID = 'BOOKING_TIME_INVALID',
  SESSION_CANNOT_BE_COMPLETED = 'SESSION_CANNOT_BE_COMPLETED',
  REVIEW_REQUIREMENTS_NOT_MET = 'REVIEW_REQUIREMENTS_NOT_MET',
  
  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Server Errors (500)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Service Unavailable (503)
  PAYMENT_GATEWAY_UNAVAILABLE = 'PAYMENT_GATEWAY_UNAVAILABLE',
  NOTIFICATION_SERVICE_UNAVAILABLE = 'NOTIFICATION_SERVICE_UNAVAILABLE'
}
```

### Error Recovery Mechanisms

```typescript
// Error Recovery Strategies
interface ErrorRecovery {
  retryableErrors: {
    maxRetries: 3;
    backoffStrategy: 'exponential' | 'linear' | 'fixed';
    retryableStatusCodes: [500, 502, 503, 504];
  };
  
  fallbackStrategies: {
    paymentFailure: 'retry_with_different_method' | 'hold_booking' | 'cancel_booking';
    notificationFailure: 'queue_for_retry' | 'try_alternative_channel';
    searchFailure: 'return_cached_results' | 'simplified_search';
  };
  
  circuitBreaker: {
    failureThreshold: 5;
    resetTimeout: 60000; // ms
    monitoredServices: ['payment-gateway', 'notification-service'];
  };
}
```

## Event-Driven Architecture

### Domain Events

```typescript
// Domain Event Types
interface DomainEvents {
  // Booking Events
  BookingCreated: {
    bookingId: string;
    studentId: string;
    tutorId: string;
    sessionTime: DateRange;
    amount: number;
  };
  
  BookingConfirmed: {
    bookingId: string;
    confirmationTime: Date;
  };
  
  PaymentCompleted: {
    bookingId: string;
    transactionId: string;
    amount: number;
    commission: number;
    tutorAmount: number;
  };
  
  SessionStarted: {
    bookingId: string;
    actualStartTime: Date;
  };
  
  SessionCompleted: {
    bookingId: string;
    actualEndTime: Date;
    duration: number;
  };
  
  BookingCancelled: {
    bookingId: string;
    cancelledBy: string;
    reason: string;
    refundAmount?: number;
  };
  
  // Chat Events
  ChatRoomCreated: {
    roomId: string;
    bookingId: string;
    participants: string[];
  };
  
  MessageSent: {
    messageId: string;
    roomId: string;
    senderId: string;
    content: string;
    type: MessageType;
  };
  
  // Review Events
  ReviewSubmitted: {
    reviewId: string;
    bookingId: string;
    tutorId: string;
    studentId: string;
    rating: number;
    comment: string;
  };
  
  // Notification Events
  NotificationTriggered: {
    type: NotificationType;
    recipients: string[];
    data: any;
  };
}

// Event Handlers
interface EventHandlers {
  onBookingCreated: [
    'SendBookingConfirmationToStudent',
    'NotifyTutorOfNewBooking',
    'CreatePaymentTransaction'
  ];
  
  onPaymentCompleted: [
    'UpdateBookingStatus',
    'CreateChatRoom',
    'NotifyBothParties',
    'UpdateTutorBalance'
  ];
  
  onSessionCompleted: [
    'EnableReviewSubmission',
    'ArchiveChatRoom',
    'UpdateTutorStats',
    'SendCompletionEmails'
  ];
  
  onReviewSubmitted: [
    'UpdateTutorRating',
    'NotifyTutorOfReview',
    'UpdateTutorProfile'
  ];
}
```

This comprehensive architecture design provides a solid foundation for implementing the Student Tutor Discovery & Booking workflow using Clean Architecture principles. Each layer has clear responsibilities, and the modular structure allows for independent development and testing of components while maintaining proper separation of concerns.