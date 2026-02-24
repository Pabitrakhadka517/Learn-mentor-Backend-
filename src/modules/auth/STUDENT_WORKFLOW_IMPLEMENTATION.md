# Student Registration & Login - Clean Architecture Implementation

## Overview

This implementation provides a comprehensive **Student Registration & Login workflow** following Clean Architecture principles and the specific layered backend flow you requested.

## Implementation Summary

### ✅ **Complete Clean Architecture Structure**

```
src/modules/auth/
├── domain/
│   ├── entities/
│   │   ├── user.entity.ts                 # User business entity with validation
│   │   └── refresh-token.entity.ts        # Refresh token entity
│   └── interfaces/
│       ├── auth.repository.interface.ts   # Repository contract
│       └── token.service.interface.ts     # Token service contract
├── application/
│   ├── dto/
│   │   └── auth.dto.ts                    # Enhanced DTOs with Zod validation
│   └── use-cases/
│       ├── register.usecase.ts            # Registration business logic
│       ├── login.usecase.ts               # Login business logic
│       ├── refresh-token.usecase.ts       # Token refresh logic
│       └── logout.usecase.ts              # Logout logic
├── infrastructure/
│   ├── repositories/
│   │   └── auth.repository.impl.ts        # MongoDB repository implementation
│   └── services/
│       └── token.service.ts               # JWT token service implementation
├── presentation/
│   ├── controllers/
│   │   └── auth.controller.clean.ts       # Clean Architecture controller
│   ├── middleware/
│   │   └── rate-limit.middleware.ts       # Advanced rate limiting
│   └── routes/
│       └── auth.routes.clean.ts           # RESTful route definitions
└── auth.module.clean.ts                   # Dependency injection module
```

### ✅ **Exact Layered Backend Flow Implementation**

#### **1️⃣ Registration Flow (POST /api/auth/register)**

| Layer | Implementation |
|-------|----------------|
| **Presentation** | `AuthControllerClean.register()` - Rate limiter validates max 100 per 15 min |
| **DTO/Validation** | `RegisterDTOSchema.parse()` - Validates email format, password strength, role (STUDENT) |
| **Repository** | `AuthRepository.emailExists()` - Checks MongoDB for duplicates |
| | `AuthRepository.hashPassword()` - bcrypt hashing (saltRounds = 10) |
| | `AuthRepository.createUser()` - Inserts user with role STUDENT, isActive: true, isVerified: false |
| **Service** | `TokenService.generateTokens()` - Creates access (15 min) & refresh (7-day) tokens |
| | Refresh token hashed with bcrypt and stored in refreshtokens collection |
| **Response** | Returns `{ success: true, accessToken, refreshToken, user }` |

#### **2️⃣ Login Flow (POST /api/auth/login)**

| Layer | Implementation |
|-------|----------------|
| **Presentation** | `AuthControllerClean.login()` - Rate limiter validates frequency |
| **DTO/Validation** | `LoginDTOSchema.parse()` - Validates email and password presence/format |
| **Repository** | `AuthRepository.findByEmail()` - Fetches user document |
| | Checks `user.isActive` (403 if inactive) |
| | `AuthRepository.verifyPassword()` - bcrypt comparison |
| **Service** | `TokenService.generateTokens()` - Generates new tokens |
| | Deletes old refresh tokens for user (token rotation) |
| | Hashes and stores new refresh token |
| **Response** | Returns `{ success: true, accessToken, refreshToken, userProfile }` |

### ✅ **Security Implementation**

#### **Rate Limiting (Max 100 per 15 min)**
```typescript
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many authentication requests from this IP'
});
```

#### **Enhanced Password Security**
- **bcrypt** with configurable salt rounds (default: 10)
- **Password strength validation**: uppercase, lowercase, numbers, special characters
- **Business rules**: ADMIN role prevention, email uniqueness at DB level
- **Token rotation**: Prevents replay attacks

#### **JWT Token Strategy**
- **Access Token**: 15-minute expiry, short-lived
- **Refresh Token**: 7-day expiry, hashed and stored
- **Dual-token strategy** for security
- **Token rotation** on each login

### ✅ **Business Rules Implementation**

#### **Registration Rules**
- Email uniqueness enforced at database level
- Password stored hashed (bcrypt)
- Role enforcement prevents self-registering as ADMIN
- TUTOR accounts created with verification status 'PENDING'
- STUDENT accounts can register directly

#### **Login Rules**  
- Inactive accounts blocked (403)
- Invalid credentials return 401
- Token rotation prevents replay attacks
- Account verification requirements for different roles

### ✅ **Complete API Endpoints**

```http
# Registration
POST /api/auth/register
Content-Type: application/json
{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "role": "STUDENT"
}

# Login  
POST /api/auth/login
Content-Type: application/json
{
  "email": "student@example.com",
  "password": "SecurePass123!"
}

# Token Refresh
POST /api/auth/refresh
Content-Type: application/json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

# Logout
POST /api/auth/logout
Authorization: Bearer <access_token>
```

### ✅ **Integration Example**

```typescript
// app.ts - Main application setup
import { AuthModuleClean } from './modules/auth/auth.module.clean';

// Initialize Clean Architecture Auth Module
const authModule = await AuthModuleClean.initialize();

// Add routes with all security middleware
app.use('/api/auth', authModule.getRouter());

// Health check
app.get('/health/auth', async (req, res) => {
  const health = await authModule.healthCheck();
  res.json(health);
});
```

### ✅ **Advanced Features**

#### **Rate Limiting Tiers**
- **General Auth**: 100 requests/15min
- **Login Specific**: 10 attempts/15min  
- **Registration**: 5 attempts/hour
- **Password Reset**: 5 attempts/hour

#### **Security Monitoring**
- **Suspicious activity detection**
- **Request frequency analysis**
- **Security event logging**
- **Bot detection patterns**

#### **Entity Business Logic**
```typescript
// User Entity with business rules
user.canCreateJobs()      // Role-based permissions
user.canReceiveJobs()     // Verification requirements  
user.hasCompleteProfile() // Profile completion check
user.withVerification()   // Status updates
```

#### **Repository Pattern**
```typescript
// Clean database operations
await authRepository.emailExists(email)
await authRepository.createUser(userEntity)  
await authRepository.verifyPassword(password, hash)
await authRepository.storeRefreshToken(tokenEntity)
```

### ✅ **Error Handling**

#### **Standardized Error Responses**
```json
{
  "success": false,
  "message": "Validation failed", 
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### **HTTP Status Codes**
- **201**: Successful registration
- **200**: Successful login
- **400**: Validation errors
- **401**: Invalid credentials
- **403**: Account deactivated/insufficient permissions
- **429**: Rate limit exceeded
- **500**: Internal server error

### ✅ **Clean Architecture Benefits**

#### **Separation of Concerns**
- **Controllers**: HTTP requests/responses only
- **Use Cases**: Business rules orchestration  
- **Repositories**: Abstract database operations
- **DTOs**: Type safety and validation
- **Entities**: Core business logic

#### **Dependency Inversion**
```typescript
// High-level modules don't depend on low-level modules
class RegisterUseCase {
  constructor(
    private authRepository: IAuthRepository,    // Interface
    private tokenService: ITokenService        // Interface
  ) {}
}
```

#### **Testability**
```typescript
// Easy to mock dependencies for testing
const mockRepository = mock<IAuthRepository>();
const mockTokenService = mock<ITokenService>();
const useCase = new RegisterUseCase(mockRepository, mockTokenService);
```

## Summary

This implementation provides a **production-ready Student Registration & Login system** that:

✅ **Follows Clean Architecture** with proper layer separation  
✅ **Implements the exact layered flow** you specified  
✅ **Enforces security best practices** (rate limiting, bcrypt, JWT)  
✅ **Provides comprehensive validation** (Zod schemas, business rules)  
✅ **Supports role-based access control** (STUDENT/TUTOR/ADMIN)  
✅ **Includes advanced monitoring** (security events, suspicious activity)  
✅ **Maintains backward compatibility** with existing auth system  
✅ **Enables easy testing** through dependency injection  

The system is ready for production use and can be extended with additional features like email verification, password reset, and social authentication while maintaining the clean architecture structure.