# Clean Architecture Design: Authentication & Security Flow

## 🔐 **Architecture Overview**

This document outlines the Clean Architecture design for the **User Authentication & Security** system in the LearnMentor platform, emphasizing robust security practices, token management, and role-based access control.

---

## 📋 **Table of Contents**

1. [Clean Architecture Layers](#clean-architecture-layers)
2. [Security Architecture Diagrams](#security-architecture-diagrams)
3. [Authentication Flow Sequences](#authentication-flow-sequences)
4. [Token Management Lifecycle](#token-management-lifecycle)
5. [Security Implementation Layers](#security-implementation-layers)
6. [Validation & Rate Limiting](#validation--rate-limiting)
7. [Tutor-Specific Creation Flow](#tutor-specific-creation-flow)
8. [Security Best Practices](#security-best-practices)

---

## 🏛️ **Clean Architecture Layers**

### **Layer 1: Presentation Layer (Controllers)**
**Location:** `src/modules/auth/auth.controller.ts`

**Responsibilities:**
- HTTP request/response handling
- Route parameter extraction & validation
- Input sanitization (Zod schema validation)
- Error formatting & status code mapping
- Delegate to Service layer

### **Layer 2: Application Layer (Services)**
**Location:** `src/modules/auth/auth.service.ts`

**Responsibilities:**
- Business logic orchestration
- Token generation & validation
- Cross-module coordination (TutorProfile creation)
- Email service integration
- Security policy enforcement

### **Layer 3: Domain Layer (Models & DTOs)**
**Location:** `src/modules/auth/user.model.ts`, `src/modules/auth/auth.dto.ts`

**Responsibilities:**
- Entity definitions & business rules
- Schema validation with Zod
- Type safety enforcement
- Domain constraints & relationships

### **Layer 4: Infrastructure Layer (Repositories)**
**Location:** `src/modules/auth/auth.repository.ts`

**Responsibilities:**
- Database abstraction
- Password hashing (bcrypt)
- Token storage & retrieval
- Data persistence operations

### **Layer 5: Database Layer**
**Technology:** MongoDB with Mongoose ODM

**Responsibilities:**
- Secure data storage
- Index optimization
- Query performance
- Data integrity constraints

### **Layer 6: Security Layer**
**Location:** Middleware, Configuration, JWT

**Responsibilities:**
- Rate limiting enforcement
- JWT token management
- Password security (bcrypt)
- Input validation & sanitization
- CORS & security headers

---

## 🔒 **Security Architecture Diagrams**

### **High-Level Security Architecture**

```mermaid
graph TB
    subgraph "SECURITY PERIMETER"
        A1[Rate Limiter] --> A2[CORS Middleware]
        A2 --> A3[Helmet Security Headers]
        A3 --> A4[Input Validation Zod]
    end
    
    subgraph "PRESENTATION LAYER"
        B1[AuthController.register] --> B2[AuthController.login]
        B2 --> B3[AuthController.refresh]
        B3 --> B4[AuthController.logout]
        B4 --> B5[AuthController.resetPassword]
    end
    
    subgraph "APPLICATION LAYER"
        C1[AuthService] --> C2[EmailService]
        C2 --> C3[TutorService Integration]
    end
    
    subgraph "DOMAIN LAYER"
        D1[User Model] --> D2[RefreshToken Model]
        D2 --> D3[PasswordResetToken Model]
        D3 --> D4[TutorProfile Model]
    end
    
    subgraph "INFRASTRUCTURE LAYER"
        E1[AuthRepository] --> E2[bcrypt Hashing]
        E2 --> E3[JWT Management]
        E3 --> E4[Token Storage]
    end
    
    subgraph "DATABASE LAYER"
        F1[(users)] --> F2[(refreshtokens)]
        F2 --> F3[(passwordresettokens)]
        F3 --> F4[(tutorprofiles)]
    end
    
    A1 --> B1
    B1 --> C1
    C1 --> D1
    D1 --> E1
    E1 --> F1
```

### **Authentication Security Flow**

```mermaid
graph LR
    subgraph "CLIENT REQUEST"
        A1[Flutter App] --> A2[HTTP Request]
        A2 --> A3[Authorization Header]
    end
    
    subgraph "SECURITY MIDDLEWARE PIPELINE"
        B1[Rate Limiter] --> B2[CORS Check]
        B2 --> B3[Helmet Headers]
        B3 --> B4[Body Parser]
        B4 --> B5[Zod Validation]
    end
    
    subgraph "AUTHENTICATION LAYER"
        C1[JWT Verification] --> C2[Token Extraction]
        C2 --> C3[Signature Validation]
        C3 --> C4[Expiry Check]
        C4 --> C5[User Lookup]
        C5 --> C6[Account Status Check]
    end
    
    subgraph "AUTHORIZATION LAYER"
        D1[Role Verification] --> D2[Permission Check]
        D2 --> D3[Resource Ownership]
        D3 --> D4[Business Rule Validation]
    end
    
    A3 --> B1
    B5 --> C1
    C6 --> D1
    D4 --> E[Controller Method]
```

---

## 🔄 **Authentication Flow Sequences**

### **Registration Flow (Student/Tutor)**

```mermaid
sequenceDiagram
    participant C as Flutter Client
    participant RL as Rate Limiter
    participant CC as AuthController
    participant AS as AuthService
    participant AR as AuthRepository
    participant TS as TutorService
    participant DB as MongoDB
    participant ES as EmailService
    
    Note over C,ES: User Registration Flow
    
    C->>RL: POST /api/auth/register
    RL->>CC: Rate check (100 req/15min)
    CC->>CC: Zod validation (email, password, role)
    CC->>AS: AuthService.register(dto)
    
    Note over AS,DB: Business Logic Layer
    
    AS->>AS: Validate role ≠ ADMIN
    AS->>AR: AuthRepository.emailExists(email)
    AR->>DB: Query users collection
    DB-->>AR: Email availability
    AR-->>AS: Email check result
    
    alt Email exists
        AS-->>CC: Error: Email already exists
        CC-->>C: 400 Bad Request
    else Email available
        AS->>AR: AuthRepository.hashPassword(password)
        AR->>AR: bcrypt.hash(password, 10 rounds)
        AR-->>AS: Password hash
        
        AS->>AR: AuthRepository.createUser()
        AR->>DB: Insert into users collection
        DB-->>AR: User created
        
        alt Role is TUTOR
            AS->>TS: Create TutorProfile
            TS->>DB: Insert tutorprofiles (status: PENDING)
        end
        
        AS->>AS: Generate JWT tokens
        AS->>AR: Store refresh token (hashed)
        AR->>DB: Insert into refreshtokens
        
        AS-->>CC: Registration success + tokens
        CC-->>C: 201 Created {user, accessToken, refreshToken}
    end
```

### **Login Flow**

```mermaid
sequenceDiagram
    participant C as Flutter Client
    participant RL as Rate Limiter
    participant CC as AuthController
    participant AS as AuthService
    participant AR as AuthRepository
    participant DB as MongoDB
    
    Note over C,DB: User Login Flow
    
    C->>RL: POST /api/auth/login {email, password}
    RL->>CC: Rate check (100 req/15min)
    CC->>CC: Zod validation
    CC->>AS: AuthService.login(dto)
    
    AS->>AR: AuthRepository.findByEmail(email)
    AR->>DB: Query users by email
    DB-->>AR: User document
    
    alt User not found
        AR-->>AS: null
        AS-->>CC: Error: Invalid credentials
        CC-->>C: 401 Unauthorized
    else User found
        AS->>AS: Check user.isActive
        alt Account deactivated
            AS-->>CC: Error: Account deactivated
            CC-->>C: 403 Forbidden
        else Account active
            AS->>AR: AuthRepository.verifyPassword()
            AR->>AR: bcrypt.compare(password, hash)
            AR-->>AS: Password verification result
            
            alt Invalid password
                AS-->>CC: Error: Invalid credentials
                CC-->>C: 401 Unauthorized
            else Valid password
                AS->>AS: Generate new JWT tokens
                AS->>AR: Delete old refresh tokens
                AS->>AR: Store new refresh token (hashed)
                AR->>DB: Update refreshtokens collection
                
                AS-->>CC: Login success + tokens
                CC-->>C: 200 OK {user, accessToken, refreshToken}
            end
        end
    end
```

### **Token Refresh Flow**

```mermaid
sequenceDiagram
    participant C as Flutter Client
    participant CC as AuthController
    participant AS as AuthService
    participant AR as AuthRepository
    participant DB as MongoDB
    
    Note over C,DB: Token Refresh Flow
    
    C->>CC: POST /api/auth/refresh {refreshToken}
    CC->>AS: AuthService.refreshAccessToken(token)
    
    AS->>AS: jwt.verify(refreshToken, refreshSecret)
    
    alt Invalid/Expired token
        AS-->>CC: Error: Invalid refresh token
        CC-->>C: 401 Unauthorized
    else Valid token
        AS->>AR: AuthRepository.findById(userId)
        AR->>DB: Query users
        DB-->>AR: User document
        
        AS->>AS: Check user.isActive
        AS->>AR: AuthRepository.findRefreshTokenByCompare()
        AR->>DB: Query refreshtokens
        AR->>AR: bcrypt.compare(token, storedHash)
        
        alt Token not found in DB
            AR-->>AS: null
            AS-->>CC: Error: Invalid refresh token  
            CC-->>C: 401 Unauthorized
        else Token valid
            AS->>AS: Generate new accessToken
            AS-->>CC: New access token
            CC-->>C: 200 OK {accessToken}
        end
    end
```

---

## 🔑 **Token Management Lifecycle**

### **JWT Token Architecture**

```mermaid
graph TB
    subgraph "ACCESS TOKEN (15 min)"
        A1[JWT Header] --> A2[JWT Payload]
        A2 --> A3[JWT Signature]
        A3 --> A4[Contains: userId, role, email]
    end
    
    subgraph "REFRESH TOKEN (7 days)"
        B1[JWT Refresh] --> B2[Longer Expiry]
        B2 --> B3[Stored as Hash in DB]
        B3 --> B4[Used for Access Token Renewal]
    end
    
    subgraph "PASSWORD RESET TOKEN (15 min)"
        C1[Crypto Random Bytes] --> C2[SHA256 Hash]
        C2 --> C3[Stored in DB with Expiry]
        C3 --> C4[Single Use Only]
    end
    
    subgraph "TOKEN SECURITY MEASURES"
        D1[bcrypt Hashing] --> D2[Database Storage]
        D2 --> D3[Automatic Cleanup]
        D3 --> D4[Expiry Validation]
    end
    
    A4 --> D1
    B4 --> D1
    C4 --> D1
```

### **Token Storage Strategy**

| Token Type | Storage Location | Security Method | Expiry | Cleanup Strategy |
|------------|------------------|-----------------|--------|------------------|
| **Access Token** | Client Memory | JWT Signature | 15 minutes | Auto-expiry |
| **Refresh Token** | MongoDB | bcrypt hash | 7 days | Database cleanup job |
| **Reset Token** | MongoDB | SHA256 hash | 15 minutes | Auto-deletion + used flag |

### **Token Security Implementation**

```typescript
// Token Hashing Pattern (Repository Layer)
export class AuthRepository {
    // Refresh token storage with hashing
    static async storeRefreshToken(userId: string, token: string, expiresAt: Date) {
        // Remove old tokens (single-device policy)
        await RefreshToken.deleteMany({ userId });
        
        // Hash token before storage
        const tokenHash = await bcrypt.hash(token, 10);
        
        // Store hashed token
        await RefreshToken.create({
            userId,
            tokenHash,
            expiresAt
        });
    }
    
    // Secure token verification
    static async findRefreshTokenByCompare(userId: string, rawToken: string) {
        const storedTokens = await RefreshToken.find({
            userId,
            expiresAt: { $gt: new Date() }
        });
        
        // Compare with each stored hash
        for (const stored of storedTokens) {
            const isMatch = await bcrypt.compare(rawToken, stored.tokenHash);
            if (isMatch) return stored;
        }
        
        return null; // Token not found or invalid
    }
}
```

---

## 🛡️ **Security Implementation Layers**

### **Input Validation Layer (Zod Schemas)**

```typescript
// Registration validation with security rules
export const RegisterDTOSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain uppercase letter')
        .regex(/[a-z]/, 'Must contain lowercase letter')  
        .regex(/[0-9]/, 'Must contain number')
        .regex(/[@$!%*?&#]/, 'Must contain special character'),
    role: z.enum(['STUDENT', 'TUTOR']).optional().default('STUDENT'),
    fullName: z.string().optional(),
    phone: z.string().optional(),
});

// Business rule: Prevent admin registration via public endpoints
static async register(dto: RegisterDTO) {
    const validated = RegisterDTOSchema.parse(dto);
    
    if (validated.role === 'ADMIN') {
        throw new Error('Admin accounts cannot be created via public registration');
    }
    // ... continue with registration
}
```

### **Password Security Layer**

```typescript
// bcrypt implementation with security best practices
export const bcryptConfig = {
    saltRounds: 10, // Industry standard for 2024
};

export class AuthRepository {
    // Secure password hashing
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, bcryptConfig.saltRounds);
    }
    
    // Secure password verification
    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
```

### **Rate Limiting Layer**

```typescript
// Rate limiting configuration (from routes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Applied to sensitive endpoints
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
```

---

## ✅ **Validation & Rate Limiting**

### **Multi-Layer Validation Strategy**

```mermaid
graph TB
    subgraph "VALIDATION PIPELINE"
        A1[HTTP Request] --> B1[Rate Limiter Check]
        B1 --> B2[CORS Validation]
        B2 --> B3[Content-Type Check]
        B3 --> B4[Body Size Limit]
        B4 --> B5[Zod Schema Validation]
        B5 --> B6[Business Rule Validation]
        B6 --> B7[Database Constraints]
    end
    
    subgraph "SECURITY CHECKS"
        C1[Email Format] --> C2[Password Strength]
        C2 --> C3[Role Validation]
        C3 --> C4[Duplicate Prevention]
        C4 --> C5[Account Status]
    end
    
    B5 --> C1
    B6 --> C4
    B7 --> D[Controller Method]
```

### **Rate Limiting Strategy**

| Endpoint | Rate Limit | Window | Purpose |
|----------|------------|---------|---------|
| `/api/auth/register` | 100 req/15min | Per IP | Prevent mass account creation |
| `/api/auth/login` | 100 req/15min | Per IP | Prevent credential brute force |
| `/api/auth/forgot-password` | 100 req/15min | Per IP | Prevent email spam |
| `/api/auth/refresh` | 100 req/15min | Per IP | Prevent token abuse |

---

## 🎓 **Tutor-Specific Creation Flow**

### **Tutor Registration Process**

```mermaid
sequenceDiagram
    participant T as Tutor (Flutter)
    participant AC as AuthController  
    participant AS as AuthService
    participant AR as AuthRepository
    participant TS as TutorService
    participant DB as MongoDB
    
    Note over T,DB: Tutor-Specific Registration
    
    T->>AC: POST /api/auth/register {role: 'TUTOR'}
    AC->>AS: AuthService.register({role: 'TUTOR'})
    
    AS->>AR: Create User with role=TUTOR
    AR->>DB: Insert into users
    
    Note over AS,DB: Tutor-Specific Logic
    
    AS->>AS: Check if role === 'TUTOR'
    AS->>TS: Create TutorProfile
    TS->>DB: Insert into tutorprofiles
    Note right of DB: verificationStatus: 'PENDING'<br/>bio: ''<br/>hourlyRate: 0<br/>subjects: []
    
    AS->>AS: Generate JWT tokens
    AS->>AR: Store refresh token
    
    AS-->>AC: Success + tokens + user profile
    AC-->>T: 201 Created {user, tutorProfile, tokens}
    
    Note over T,DB: Initial Profile State
    T->>T: User sees "Profile incomplete"
    T->>T: Must complete profile before verification
```

### **Tutor Profile Data Structure**

```javascript
// Initial TutorProfile creation
{
  user: ObjectId, // Reference to User document
  bio: "", // Empty - must be filled
  experienceYears: 0, // Must be updated
  hourlyRate: 0, // Must be set
  languages: [], // Empty array
  subjects: [], // Empty array
  verificationStatus: "PENDING", // Awaiting admin approval
  totalClasses: 0,
  rating: 0,
  reviewsCount: 0,
  averageRating: 0,
  totalReviews: 0
}
```

### **Cross-Module Integration**

```typescript
// Service Layer - Cross-module coordination
export class AuthService {
    static async register(dto: RegisterDTO) {
        // ... user creation logic
        
        // Tutor-specific profile creation
        if (role === 'TUTOR') {
            const { TutorProfile } = require('../tutor/tutor.model');
            await TutorProfile.create({ 
                user: user._id, 
                verificationStatus: 'PENDING' 
            });
        }
        
        return { user, accessToken, refreshToken };
    }
}
```

---

## 🔒 **Security Best Practices**

### **Password Security Implementation**

```typescript
// Comprehensive password validation
const passwordValidation = z.string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Requires uppercase letter')
    .regex(/[a-z]/, 'Requires lowercase letter')
    .regex(/[0-9]/, 'Requires number')
    .regex(/[@$!%*?&#]/, 'Requires special character');

// bcrypt with appropriate salt rounds
const saltRounds = 10; // ~100ms hashing time (2024 standard)
```

### **JWT Security Configuration**

```typescript
export const jwtConfig = {
    accessSecret: process.env.JWT_ACCESS_SECRET,   // Separate secrets
    refreshSecret: process.env.JWT_REFRESH_SECRET, // Different key
    accessExpiry: "15m",  // Short-lived
    refreshExpiry: "7d",  // Longer-lived
    resetTokenExpiry: "15m" // Very short for reset
};

// Token payload minimization
const accessTokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    email: user.email // Only necessary fields
};
```

### **Database Security Patterns**

```javascript
// Secure indexes for performance + security
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.refreshtokens.createIndex({ "userId": 1 });
db.refreshtokens.createIndex({ "expiresAt": 1 }); // Auto-cleanup
db.passwordresettokens.createIndex({ "tokenHash": 1 });
db.passwordresettokens.createIndex({ "expiresAt": 1 });

// Automatic token cleanup
db.refreshtokens.createIndex(
    { "expiresAt": 1 }, 
    { expireAfterSeconds: 0 } // TTL index
);
```

### **Error Handling Security**

```typescript
// Secure error messages (don't leak information)
export class AuthService {
    static async login(dto: LoginDTO) {
        const user = await AuthRepository.findByEmail(dto.email);
        
        if (!user || !await AuthRepository.verifyPassword(dto.password, user.passwordHash)) {
            // Same error for both cases (timing attack prevention)
            throw new Error('Invalid credentials');
        }
        
        if (!user.isActive) {
            throw new Error('Account is deactivated. Please contact support.');
        }
        
        // ... continue with successful login
    }
}
```

### **Session Management Security**

```typescript
// Single-device policy (optional)
static async storeRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    // Remove old refresh tokens for this user
    await RefreshToken.deleteMany({ userId });
    
    // Store only the new token
    await RefreshToken.create({ userId, tokenHash, expiresAt });
}

// Logout everywhere (security feature)
static async logout(userId: string) {
    await RefreshToken.deleteMany({ userId }); // Clear all sessions
    return { message: 'Logged out from all devices' };
}
```

---

## ⚡ **Performance & Monitoring**

### **Security Monitoring Points**

```typescript
// Authentication event logging
export class AuthService {
    static async login(dto: LoginDTO) {
        try {
            const result = await this.performLogin(dto);
            
            // Log successful login
            console.log(`✅ Login successful: ${dto.email} at ${new Date().toISOString()}`);
            
            return result;
        } catch (error) {
            // Log failed login attempt
            console.warn(`❌ Login failed: ${dto.email} - ${error.message} at ${new Date().toISOString()}`);
            
            // Could trigger additional security measures here
            // (e.g., account lockout after N failed attempts)
            
            throw error;
        }
    }
}
```

### **Database Optimization for Auth**

```javascript
// Compound indexes for auth queries
db.users.createIndex({ "email": 1, "isActive": 1 });
db.refreshtokens.createIndex({ "userId": 1, "expiresAt": 1 });

// Aggregation pipeline for user lookup with profile
[
    { $match: { _id: ObjectId(userId) } },
    { 
        $lookup: {
            from: "tutorprofiles",
            localField: "_id", 
            foreignField: "user",
            as: "tutorProfile"
        }
    },
    { $unwind: { path: "$tutorProfile", preserveNullAndEmptyArrays: true } }
]
```

---

## 🧪 **Testing Strategy**

### **Security Test Categories**

```typescript
// Unit Tests - Repository Layer
describe('AuthRepository.hashPassword', () => {
    it('should hash password with bcrypt', async () => {
        const password = 'TestPassword123!';
        const hash = await AuthRepository.hashPassword(password);
        
        expect(hash).not.toBe(password);
        expect(hash.startsWith('$2b$10$')).toBe(true);
    });
});

// Integration Tests - Service Layer  
describe('AuthService.register', () => {
    it('should create tutor with profile', async () => {
        const tutorData = {
            email: 'tutor@test.com',
            password: 'Password123!',
            role: 'TUTOR'
        };
        
        const result = await AuthService.register(tutorData);
        
        expect(result.user.role).toBe('TUTOR');
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
    });
});

// End-to-End Tests - Controller Layer
describe('POST /api/auth/login', () => {
    it('should return tokens for valid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'Password123!'
            })
            .expect(200);
            
        expect(response.body.success).toBe(true);
        expect(response.body.accessToken).toBeDefined();
    });
});
```

---

> **Summary:** This Clean Architecture design provides a robust, secure, and scalable authentication system with comprehensive token management, role-based access control, and defense-in-depth security practices. The multi-layered approach ensures separation of concerns while maintaining strong security postures across all system components.