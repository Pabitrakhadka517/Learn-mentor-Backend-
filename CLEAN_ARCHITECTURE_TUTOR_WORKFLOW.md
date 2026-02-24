# Clean Architecture Design: Tutor Workflow System

## 🏗️ **Architecture Overview**

This document outlines the Clean Architecture design for the **Tutor Registration, Profile Management, Availability & Booking Management** workflow in the LearnMentor platform.

---

## 📋 **Table of Contents**

1. [Clean Architecture Layers](#clean-architecture-layers)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Layer-by-Layer Flow](#layer-by-layer-flow)
4. [Role-Based Access Control](#role-based-access-control)
5. [Real-Time Event System](#real-time-event-system)
6. [Sequence Flows](#sequence-flows)
7. [Error Handling Strategy](#error-handling-strategy)

---

## 🏛️ **Clean Architecture Layers**

### **Layer 1: Presentation Layer (Controllers)**
**Location:** `src/modules/*/controller.ts`

**Responsibilities:**
- Handle HTTP requests/responses
- Input validation (Zod schemas)
- Route parameter extraction
- Delegate to Service layer
- Format response data

### **Layer 2: Application Layer (Services)**
**Location:** `src/modules/*/service.ts`

**Responsibilities:**
- Business logic orchestration
- Cross-module coordination
- Transaction management
- Event triggering
- Data transformation

### **Layer 3: Domain Layer (Models & DTOs)**
**Location:** `src/modules/*/model.ts`, `src/modules/*/dto.ts`

**Responsibilities:**
- Entity definitions
- Business rules
- Data validation schemas
- Type definitions
- Domain constraints

### **Layer 4: Infrastructure Layer (Repositories)**
**Location:** `src/modules/*/repository.ts` (implied in services)

**Responsibilities:**
- Database abstraction
- Query optimization
- Data persistence
- External service integration
- Caching strategies

### **Layer 5: Database Layer**
**Technology:** MongoDB with Mongoose ODM

**Responsibilities:**
- Data storage
- ACID compliance
- Indexing
- Aggregations
- Performance optimization

### **Layer 6: Event Layer**
**Technology:** Socket.io + Notification System

**Responsibilities:**
- Real-time communication
- Event broadcasting
- Push notifications
- Cross-module messaging

---

## 🔄 **Architecture Diagrams**

### **High-Level Clean Architecture Flow**

```mermaid
graph TB
    subgraph "PRESENTATION LAYER"
        A1[TutorController] --> A2[BookingController]
        A2 --> A3[ProfileController]
        A3 --> A4[DashboardController]
        A4 --> A5[NotificationController]
    end
    
    subgraph "APPLICATION LAYER"
        B1[TutorService] --> B2[BookingService]
        B2 --> B3[ProfileService]
        B3 --> B4[DashboardService]
        B4 --> B5[NotificationService]
        B5 --> B6[ChatService]
    end
    
    subgraph "DOMAIN LAYER"
        C1[User Model] --> C2[TutorProfile Model]
        C2 --> C3[Booking Model]
        C3 --> C4[AvailabilitySlot Model]
        C4 --> C5[Notification Model]
        C5 --> C6[ChatRoom Model]
    end
    
    subgraph "INFRASTRUCTURE LAYER"
        D1[UserRepository] --> D2[TutorRepository]
        D2 --> D3[BookingRepository]
        D3 --> D4[NotificationRepository]
    end
    
    subgraph "DATABASE LAYER"
        E1[(users)] --> E2[(tutorprofiles)]
        E2 --> E3[(bookings)]
        E3 --> E4[(availabilityslots)]
        E4 --> E5[(notifications)]
        E5 --> E6[(chatrooms)]
    end
    
    subgraph "EVENT LAYER"
        F1[Socket.io Server] --> F2[Real-time Notifications]
        F2 --> F3[Chat Integration]
    end
    
    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B4
    A5 --> B5
    
    B1 --> C1
    B2 --> C3
    B3 --> C2
    B4 --> C1
    B5 --> C5
    
    B1 --> D1
    B2 --> D3
    B3 --> D2
    B5 --> D4
    
    D1 --> E1
    D2 --> E2
    D3 --> E3
    D4 --> E5
    
    B5 --> F1
    B6 --> F1
```

### **Tutor Workflow Data Flow Diagram**

```mermaid
sequenceDiagram
    participant F as Flutter App
    participant API as Express API
    participant MW as Middleware
    participant C as Controller
    participant S as Service
    participant R as Repository
    participant DB as MongoDB
    participant WS as Socket.io
    participant N as Notifications
    
    Note over F,N: Tutor Registration & Profile Setup
    
    F->>API: POST /api/auth/register/tutor
    API->>MW: authenticate? (No - Registration)
    MW->>C: AuthController.register
    C->>S: AuthService.registerUser({role: 'TUTOR'})
    S->>R: UserRepository.create()
    R->>DB: Insert users collection
    S->>R: TutorProfileRepository.create()
    R->>DB: Insert tutorprofiles collection
    S->>S: Generate JWT tokens
    DB-->>R: User & TutorProfile created
    R-->>S: Return entities
    S-->>C: Return user + tokens
    C-->>API: 201 Created response
    API-->>F: Registration successful
    
    Note over F,N: Profile Management Flow
    
    F->>API: PUT /api/profile
    API->>MW: authenticate ✓
    MW->>MW: authorizeRoles('TUTOR') ✓
    MW->>C: ProfileController.updateProfile
    C->>S: ProfileService.updateTutorProfile()
    S->>R: UserRepository.update()
    S->>R: TutorProfileRepository.update()
    R->>DB: Update users & tutorprofiles
    DB-->>R: Updated entities
    R-->>S: Return updated data
    S-->>C: Profile updated
    C-->>API: 200 OK response
    API-->>F: Profile updated
    
    Note over F,N: Verification Submission
    
    F->>API: POST /api/tutors/my/verify/submit
    API->>MW: authenticate ✓ → authorizeRoles('TUTOR') ✓
    MW->>C: TutorController.submitVerification
    C->>S: TutorService.submitForVerification()
    S->>R: TutorProfileRepository.update({verificationStatus: 'PENDING'})
    R->>DB: Update tutorprofiles
    S->>N: NotificationService.notifyAdmins()
    N->>WS: Socket emit 'new_notification' (Admin rooms)
    DB-->>R: Verification status updated
    R-->>S: Success
    S-->>C: Submitted for verification
    C-->>API: 200 OK response
    API-->>F: Verification submitted
    
    Note over F,N: Availability Management
    
    F->>API: POST /api/tutors/my/availability
    API->>MW: authenticate ✓ → authorizeRoles('TUTOR') ✓
    MW->>C: TutorController.setMyAvailability
    C->>S: TutorService.manageAvailability()
    S->>R: AvailabilityRepository.deleteUnbooked()
    S->>R: AvailabilityRepository.insertSlots()
    R->>DB: Delete old + Insert new availabilityslots
    DB-->>R: Slots updated
    R-->>S: Availability set
    S-->>C: Availability updated
    C-->>API: 200 OK response
    API-->>F: Availability saved
    
    Note over F,N: Booking Management
    
    F->>API: PATCH /api/bookings/{id}/status
    API->>MW: authenticate ✓ → authorizeRoles('TUTOR') ✓
    MW->>C: BookingController.updateBookingStatus
    C->>S: BookingService.acceptRejectBooking()
    S->>R: BookingRepository.update({status: 'CONFIRMED'})
    R->>DB: Update bookings
    S->>N: NotificationService.notifyStudent()
    N->>WS: Socket emit 'booking_updated' (Student room)
    DB-->>R: Booking status updated
    R-->>S: Booking confirmed
    S-->>C: Booking status changed
    C-->>API: 200 OK response
    API-->>F: Status updated
    
    Note over F,N: Dashboard Statistics
    
    F->>API: GET /api/dashboard/tutor
    API->>MW: authenticate ✓ → authorizeRoles('TUTOR') ✓
    MW->>C: DashboardController.getTutorStats
    C->>S: DashboardService.aggregateTutorStats()
    S->>R: BookingRepository.aggregateEarnings()
    S->>R: BookingRepository.getBookingCounts()
    R->>DB: Aggregation pipeline queries
    DB-->>R: Statistics data
    R-->>S: Aggregated stats
    S-->>C: Dashboard data
    C-->>API: 200 OK response
    API-->>F: Dashboard loaded
```

---

## 🔄 **Layer-by-Layer Flow**

### **1. Presentation Layer (Controllers)**

**File Locations:**
- `src/modules/auth/auth.controller.ts`
- `src/modules/tutor/tutor.controller.ts` 
- `src/modules/booking/booking.controller.ts`
- `src/modules/profile/profile.controller.ts`
- `src/modules/dashboard/dashboard.controller.ts`

**Key Responsibilities:**
```typescript
// Example Controller Pattern
export class TutorController {
    static async submitVerification(req: AuthRequest, res: Response) {
        try {
            // 1. Extract & validate inputs
            const tutorId = req.user.userId;
            
            // 2. Delegate to Service layer
            await TutorService.submitForVerification(tutorId);
            
            // 3. Format response
            res.status(200).json({
                success: true,
                message: 'Profile submitted for verification'
            });
        } catch (error) {
            // 4. Handle errors uniformly
            this.handleControllerError(res, error);
        }
    }
}
```

**API Endpoints Mapping:**
| Endpoint | Controller | Method | Middleware |
|----------|------------|--------|------------|
| `POST /api/auth/register/tutor` | AuthController | `register` | `authLimiter` |
| `PUT /api/profile` | ProfileController | `updateProfile` | `authenticate` + `authorizeRoles('TUTOR')` |
| `POST /api/tutors/my/verify/submit` | TutorController | `submitVerification` | `authenticate` + `authorizeRoles('TUTOR')` |
| `POST /api/tutors/my/availability` | TutorController | `setMyAvailability` | `authenticate` + `authorizeRoles('TUTOR')` |
| `GET /api/bookings` | BookingController | `getBookings` | `authenticate` + `authorizeRoles('TUTOR')` |
| `PATCH /api/bookings/:id/status` | BookingController | `updateBookingStatus` | `authenticate` + `authorizeRoles('TUTOR')` |
| `PATCH /api/bookings/:id/complete` | BookingController | `completeBooking` | `authenticate` + `authorizeRoles('TUTOR')` |
| `GET /api/dashboard/tutor` | DashboardController | `getTutorStats` | `authenticate` + `authorizeRoles('TUTOR')` |

### **2. Application Layer (Services)**

**File Locations:**
- `src/modules/auth/auth.service.ts`
- `src/modules/tutor/tutor.service.ts`
- `src/modules/booking/booking.service.ts` (implied)
- `src/modules/profile/profile.service.ts` (implied)
- `src/modules/dashboard/dashboard.service.ts` (implied)

**Business Logic Coordination:**
```typescript
// Example Service Pattern
export class TutorService {
    static async submitForVerification(tutorId: string) {
        // 1. Validate business rules
        const tutorProfile = await TutorProfileRepository.findByUserId(tutorId);
        if (!tutorProfile) throw new Error('Tutor profile not found');
        if (tutorProfile.verificationStatus === 'VERIFIED') {
            throw new Error('Already verified');
        }
        
        // 2. Update verification status
        await TutorProfileRepository.update(tutorId, {
            verificationStatus: 'PENDING'
        });
        
        // 3. Trigger cross-module events
        await NotificationService.notifyAdmins(
            'TUTOR_VERIFICATION_PENDING',
            { tutorId, tutorName: tutorProfile.user.fullName }
        );
        
        // 4. Return success
        return { success: true };
    }
}
```

**Cross-Module Coordination:**
- **TutorService** ↔ **NotificationService** (verification alerts)
- **BookingService** ↔ **ChatService** (auto-create chat rooms)
- **BookingService** ↔ **TransactionService** (payment processing)
- **DashboardService** ↔ **BookingService** (earnings aggregation)

### **3. Domain Layer (Models & DTOs)**

**File Locations:**
- `src/modules/auth/user.model.ts`
- `src/modules/tutor/tutor.model.ts`
- `src/modules/booking/booking.model.ts`
- `src/modules/tutor/tutor.dto.ts`

**Entity Relationships:**
```typescript
// Core Domain Models
interface IUser {
    _id: ObjectId;
    fullName?: string;
    email: string;
    role: 'STUDENT' | 'TUTOR' | 'ADMIN';
    isVerified: boolean;
    isActive: boolean;
    // ... other fields
}

interface ITutorProfile {
    user: ObjectId;  // References User._id
    bio: string;
    experienceYears: number;
    hourlyRate: number;
    subjects: string[];
    languages: string[];
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    // ... other fields
}

interface IBooking {
    student: ObjectId;  // References User._id
    tutor: ObjectId;    // References User._id
    status: BookingStatus;
    startTime: Date;
    endTime: Date;
    price: number;
    // ... other fields
}

interface IAvailabilitySlot {
    tutorId: ObjectId;  // References User._id
    startTime: Date;
    endTime: Date;
    isBooked: boolean;
}
```

### **4. Infrastructure Layer (Repositories)**

**Pattern Implementation:**
```typescript
// Repository Pattern (embedded in services)
export class TutorRepository {
    static async findByUserId(userId: string): Promise<ITutorProfile | null> {
        return await TutorProfile.findOne({ user: userId }).populate('user');
    }
    
    static async updateVerificationStatus(
        userId: string, 
        status: VerificationStatus
    ): Promise<ITutorProfile> {
        return await TutorProfile.findOneAndUpdate(
            { user: userId },
            { verificationStatus: status },
            { new: true }
        );
    }
    
    static async aggregateEarnings(tutorId: string, dateRange: DateRange) {
        return await Booking.aggregate([
            { $match: { tutor: tutorId, status: 'COMPLETED' } },
            { $group: { _id: null, totalEarnings: { $sum: '$price' } } }
        ]);
    }
}
```

### **5. Database Layer**

**Collections & Indexes:**
```javascript
// users collection
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  role: String (indexed),
  isVerified: Boolean,
  isActive: Boolean
}

// tutorprofiles collection  
{
  _id: ObjectId,
  user: ObjectId (unique, ref: users),
  verificationStatus: String (indexed),
  hourlyRate: Number (indexed),
  subjects: [String] (indexed),
  languages: [String] (indexed),
  rating: Number (indexed desc)
}

// bookings collection
{
  _id: ObjectId,
  student: ObjectId (indexed, ref: users),
  tutor: ObjectId (indexed, ref: users), 
  status: String (indexed),
  startTime: Date (indexed),
  endTime: Date,
  price: Number
}

// availabilityslots collection
{
  _id: ObjectId,
  tutorId: ObjectId (indexed, ref: users),
  startTime: Date (compound index with tutorId),
  endTime: Date,
  isBooked: Boolean (indexed)
}
```

---

## 🔒 **Role-Based Access Control**

### **Middleware Authentication Flow**

```mermaid
graph LR
    A[HTTP Request] --> B[authenticate middleware]
    B --> C{JWT Valid?}
    C -->|No| D[401 Unauthorized]
    C -->|Yes| E[authorizeRoles middleware]
    E --> F{Role Allowed?}
    F -->|No| G[403 Forbidden]
    F -->|Yes| H[Controller Method]
    H --> I[Service Layer]
```

### **Role-Based Endpoint Access**

| Endpoint | Allowed Roles | Additional Checks |
|----------|---------------|-------------------|
| `POST /api/auth/register/tutor` | `Public` | Rate limiting |
| `PUT /api/profile` | `TUTOR` | Own profile only |
| `POST /api/tutors/my/verify/submit` | `TUTOR` | Profile completeness |
| `POST /api/tutors/my/availability` | `TUTOR` | Future dates only |
| `PATCH /api/bookings/:id/status` | `TUTOR` | Own bookings only |
| `GET /api/dashboard/tutor` | `TUTOR` | Own data only |

### **Ownership Validation Pattern**

```typescript
// Service-level ownership checks
export class BookingService {
    static async updateBookingStatus(bookingId: string, tutorId: string, status: string) {
        // 1. Find booking and validate ownership
        const booking = await Booking.findById(bookingId);
        if (!booking) throw new Error('Booking not found');
        if (booking.tutor.toString() !== tutorId) {
            throw new Error('Access denied: Not your booking');
        }
        
        // 2. Validate business rules
        if (!['CONFIRMED', 'REJECTED'].includes(status)) {
            throw new Error('Invalid status');
        }
        
        // 3. Update and notify
        await booking.updateOne({ status });
        await NotificationService.notifyStudent(booking.student, 'BOOKING_UPDATED');
    }
}
```

---

## 🔄 **Real-Time Event System**

### **Socket.io Integration Architecture**

```mermaid
graph TB
    subgraph "Flutter Apps"
        A1[Tutor App] --> A2[Student App]
        A2 --> A3[Admin Dashboard]
    end
    
    subgraph "Socket.io Server"
        B1[Authentication Middleware] --> B2[Room Management]
        B2 --> B3[Event Handlers]
    end
    
    subgraph "Event Types"
        C1[new_notification] --> C2[booking_updated]
        C2 --> C3[message_received]
        C3 --> C4[verification_status_changed]
    end
    
    subgraph "Room Strategy"
        D1[User-specific rooms: userId] --> D2[Chat rooms: chatId]
        D2 --> D3[Admin broadcast: admin_notifications]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    
    B3 --> C1
    B3 --> C2
    B3 --> C3
    B3 --> C4
    
    B2 --> D1
    B2 --> D2
    B2 --> D3
```

### **Notification Event Triggers**

| Event Trigger | Target Audience | Socket Event | Notification Type |
|---------------|-----------------|--------------|-------------------|
| Tutor submits verification | Admins | `new_notification` | `TUTOR_VERIFICATION_PENDING` |
| Booking created | Tutors | `new_notification` | `BOOKING_CREATED` |
| Booking accepted/rejected | Students | `booking_updated` | `BOOKING_STATUS_CHANGED` |
| Booking completed | Both parties | `booking_updated` | `SESSION_COMPLETED` |
| Payment completed | Tutor | `new_notification` | `PAYMENT_RECEIVED` |
| Chat message sent | Chat participants | `receive_message` | `NEW_MESSAGE` |

### **Real-Time Implementation Pattern**

```typescript
// Service layer event emission
export class NotificationService {
    static async notifyBookingCreated(booking: IBooking) {
        // 1. Create notification record
        const notification = await NotificationRepository.create({
            userId: booking.tutor,
            type: 'BOOKING_CREATED',
            title: 'New Booking Request',
            message: `You have a new booking request for ${booking.startTime}`,
            data: { bookingId: booking._id }
        });
        
        // 2. Emit real-time event
        if (io) {
            io.to(booking.tutor.toString()).emit('new_notification', {
                notification,
                timestamp: new Date()
            });
        }
        
        return notification;
    }
}
```

---

## 🔄 **Sequence Flows**

### **1. Tutor Registration & Setup Flow**

```mermaid
sequenceDiagram
    participant T as Tutor (Flutter)
    participant A as API Gateway
    participant AS as Auth Service
    participant TS as Tutor Service
    participant DB as Database
    participant N as Notification Service
    
    T->>A: POST /api/auth/register/tutor
    A->>AS: AuthService.register({role: 'TUTOR'})
    AS->>DB: Create User(role=TUTOR)
    AS->>DB: Create TutorProfile(status=PENDING)
    AS->>AS: Generate JWT tokens
    DB-->>AS: User & Profile created
    AS-->>A: {user, tokens}
    A-->>T: 201 Registration successful
    
    Note over T,N: Profile Setup Phase
    
    T->>A: PUT /api/profile (bio, subjects, hourlyRate)
    A->>TS: TutorService.updateProfile()
    TS->>DB: Update TutorProfile
    DB-->>TS: Profile updated
    TS-->>A: Profile complete
    A-->>T: 200 Profile updated
    
    T->>A: POST /api/tutors/my/verify/submit
    A->>TS: TutorService.submitVerification()
    TS->>DB: Set verificationStatus=PENDING
    TS->>N: Notify admins
    N-->>TS: Notification sent
    DB-->>TS: Status updated
    TS-->>A: Submitted for review
    A-->>T: 200 Verification submitted
```

### **2. Availability Management Flow**

```mermaid
sequenceDiagram
    participant T as Tutor (Flutter)
    participant A as API Gateway  
    participant TS as Tutor Service
    participant AS as Availability Service
    participant DB as Database
    
    T->>A: GET /api/tutors/my/availability
    A->>AS: AvailabilityService.getSlots(tutorId)
    AS->>DB: Query AvailabilitySlots
    DB-->>AS: Current slots
    AS-->>A: Availability data
    A-->>T: 200 Current availability
    
    Note over T,DB: Update Availability
    
    T->>A: POST /api/tutors/my/availability (new slots)
    A->>AS: AvailabilityService.updateSlots()
    AS->>DB: Delete outdated unbooked slots
    AS->>DB: Insert new slots
    DB-->>AS: Slots updated
    AS-->>A: Availability set
    A-->>T: 200 Availability updated
```

### **3. Booking Management Flow**

```mermaid
sequenceDiagram
    participant S as Student (Flutter)
    participant T as Tutor (Flutter)
    participant A as API Gateway
    participant BS as Booking Service
    participant NS as Notification Service
    participant WS as WebSocket
    participant DB as Database
    
    Note over S,DB: Student Creates Booking
    
    S->>A: POST /api/bookings/book
    A->>BS: BookingService.createBooking()
    BS->>DB: Check conflicts
    BS->>DB: Create Booking(status=PENDING)
    BS->>NS: Notify tutor
    NS->>WS: emit('new_notification', tutorRoom)
    WS-->>T: New booking notification
    DB-->>BS: Booking created
    BS-->>A: Booking successful
    A-->>S: 201 Booking created
    
    Note over S,DB: Tutor Responds to Booking
    
    T->>A: PATCH /api/bookings/:id/status (CONFIRMED)
    A->>BS: BookingService.updateStatus()
    BS->>DB: Update booking status
    BS->>NS: Notify student
    NS->>WS: emit('booking_updated', studentRoom)
    WS-->>S: Booking confirmed notification
    DB-->>BS: Status updated
    BS-->>A: Status changed
    A-->>T: 200 Booking confirmed
    
    Note over S,DB: Session Completion
    
    T->>A: PATCH /api/bookings/:id/complete
    A->>BS: BookingService.completeSession()
    BS->>DB: Update to COMPLETED
    BS->>NS: Notify both parties
    NS->>WS: emit('session_completed')
    DB-->>BS: Session marked complete
    BS-->>A: Session completed
    A-->>T: 200 Session completed
```

---

## ⚠️ **Error Handling Strategy**

### **Error Categories & Handlers**

| Error Type | HTTP Status | Handler Location | Response Format |
|------------|-------------|------------------|------------------|
| **Validation Errors** | 400 | Controller + Zod | `{success: false, errors: [...]}` |
| **Authentication Errors** | 401 | Middleware | `{success: false, message: "Token expired"}` |
| **Authorization Errors** | 403 | Middleware | `{success: false, message: "Access denied"}` |
| **Business Logic Errors** | 409 | Service | `{success: false, message: "Booking conflict"}` |
| **Resource Not Found** | 404 | Service | `{success: false, message: "Tutor not found"}` |
| **Server Errors** | 500 | Global Handler | `{success: false, message: "Internal error"}` |

### **Error Propagation Pattern**

```typescript
// Repository Level
export class TutorRepository {
    static async findById(id: string) {
        try {
            return await TutorProfile.findById(id);
        } catch (dbError) {
            throw new DatabaseError('Failed to fetch tutor', dbError);
        }
    }
}

// Service Level  
export class TutorService {
    static async submitVerification(tutorId: string) {
        const profile = await TutorRepository.findById(tutorId);
        if (!profile) {
            throw new NotFoundError('Tutor profile not found');
        }
        if (profile.verificationStatus === 'VERIFIED') {
            throw new BusinessLogicError('Already verified');
        }
        // ... continue processing
    }
}

// Controller Level
export class TutorController {
    static async submitVerification(req: AuthRequest, res: Response) {
        try {
            await TutorService.submitVerification(req.user.userId);
            res.status(200).json({ success: true });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error instanceof BusinessLogicError) {
                return res.status(409).json({ success: false, message: error.message });
            }
            // Global error handler catches remaining
            throw error;
        }
    }
}
```

---

## 📊 **Performance Optimizations**

### **Database Indexing Strategy**

```javascript
// Optimized indexes for tutor workflow
db.tutorprofiles.createIndex({ "verificationStatus": 1 });
db.tutorprofiles.createIndex({ "hourlyRate": 1 });
db.tutorprofiles.createIndex({ "subjects": 1 });
db.tutorprofiles.createIndex({ "rating": -1 });

db.bookings.createIndex({ "tutor": 1, "status": 1 });
db.bookings.createIndex({ "tutor": 1, "startTime": 1, "endTime": 1 }); // Conflict detection

db.availabilityslots.createIndex({ "tutorId": 1, "startTime": 1 });
db.availabilityslots.createIndex({ "tutorId": 1, "isBooked": 1, "startTime": 1 });
```

### **Caching Strategy**

```typescript
// Service-level caching for frequent queries
export class TutorService {
    private static cache = new Map();
    
    static async getTutorProfile(tutorId: string) {
        const cacheKey = `tutor_profile_${tutorId}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const profile = await TutorRepository.findById(tutorId);
        this.cache.set(cacheKey, profile);
        
        // Cache expiry
        setTimeout(() => this.cache.delete(cacheKey), 300000); // 5 minutes
        
        return profile;
    }
}
```

---

## 🔧 **Development & Testing Guidelines**

### **Module Testing Strategy**

```typescript
// Unit Test Example
describe('TutorService.submitVerification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    it('should submit tutor for verification', async () => {
        // Arrange
        const mockTutor = { verificationStatus: 'PENDING' };
        TutorRepository.findById = jest.fn().mockResolvedValue(mockTutor);
        TutorRepository.update = jest.fn().mockResolvedValue(mockTutor);
        NotificationService.notifyAdmins = jest.fn();
        
        // Act
        await TutorService.submitVerification('tutor123');
        
        // Assert
        expect(TutorRepository.update).toHaveBeenCalledWith('tutor123', {
            verificationStatus: 'PENDING'
        });
        expect(NotificationService.notifyAdmins).toHaveBeenCalled();
    });
});
```

### **Integration Testing**

```typescript
// API Integration Test
describe('POST /api/tutors/my/verify/submit', () => {
    it('should submit tutor for verification', async () => {
        const response = await request(app)
            .post('/api/tutors/my/verify/submit')
            .set('Authorization', `Bearer ${tutorToken}`)
            .expect(200);
            
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('verification');
    });
});
```

---

> **Summary:** This Clean Architecture design ensures separation of concerns, maintainable code structure, robust error handling, and scalable real-time features for the tutor workflow system. The modular approach allows for independent testing, easy feature additions, and clear responsibility boundaries across all system layers.