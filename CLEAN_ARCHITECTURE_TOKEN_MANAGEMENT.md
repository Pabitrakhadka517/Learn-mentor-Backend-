# Clean Architecture Design: Token Management Flow

## 🔑 **Architecture Overview**

This document outlines the Clean Architecture design for the **Token Management System** in the LearnMentor platform, focusing on dual-token authentication strategy, secure token lifecycle management, and revocation mechanisms.

---

## 📋 **Table of Contents**

1. [Token Management Architecture](#token-management-architecture)
2. [Token Types & Security Models](#token-types--security-models)
3. [Clean Architecture Layers](#clean-architecture-layers)
4. [Token Flow Diagrams](#token-flow-diagrams)
5. [Security Implementation](#security-implementation)
6. [Storage & Persistence Strategy](#storage--persistence-strategy)
7. [Revocation & Cleanup Mechanisms](#revocation--cleanup-mechanisms)
8. [Performance Optimizations](#performance-optimizations)

---

## 🏛️ **Token Management Architecture**

### **High-Level Token Management System**

```mermaid
graph TB
    subgraph "TOKEN MANAGEMENT ECOSYSTEM"
        A1[Access Token] --> A2[Refresh Token]
        A2 --> A3[Reset Token]
        A3 --> A4[Token Validation]
        A4 --> A5[Token Revocation]
    end
    
    subgraph "PRESENTATION LAYER"
        B1[AuthController.refresh] --> B2[AuthController.logout]
        B2 --> B3[AuthController.forgotPassword]
        B3 --> B4[AuthController.resetPassword]
    end
    
    subgraph "APPLICATION LAYER"
        C1[TokenService] --> C2[ValidationService]
        C2 --> C3[RevocationService]
        C3 --> C4[CleanupService]
    end
    
    subgraph "DOMAIN LAYER"
        D1[AccessToken Entity] --> D2[RefreshToken Entity]
        D2 --> D3[ResetToken Entity]
        D3 --> D4[Token Validation Rules]
    end
    
    subgraph "INFRASTRUCTURE LAYER"
        E1[RefreshTokenRepository] --> E2[ResetTokenRepository]
        E2 --> E3[JWT Manager]
        E3 --> E4[Hashing Service]
    end
    
    subgraph "DATABASE LAYER"
        F1[(refreshtokens)] --> F2[(passwordresettokens)]
        F2 --> F3[Token Indexes]
        F3 --> F4[TTL Collections]
    end
    
    subgraph "SECURITY LAYER"
        G1[JWT HS256 Signing] --> G2[bcrypt Hashing]
        G2 --> G3[SHA256 Hashing]
        G3 --> G4[Expiry Validation]
        G4 --> G5[Signature Verification]
    end
    
    A1 --> B1
    B1 --> C1
    C1 --> D1
    D1 --> E1
    E1 --> F1
    F1 --> G1
```

### **Dual-Token Strategy Flow**

```mermaid
graph LR
    subgraph "CLIENT SIDE"
        A1[Flutter App] --> A2[Access Token Store]
        A2 --> A3[Refresh Token Store]
    end
    
    subgraph "TOKEN LIFECYCLE"
        B1[Login] --> B2[Token Generation]
        B2 --> B3[Token Usage]
        B3 --> B4[Token Expiry]
        B4 --> B5[Token Refresh]
        B5 --> B6[Token Revocation]
    end
    
    subgraph "SERVER SIDE"
        C1[JWT Generation] --> C2[Hash Storage]
        C2 --> C3[Validation Engine]
        C3 --> C4[Cleanup Service]
    end
    
    A1 --> B1
    B6 --> C4
    B2 --> C1
    B3 --> C3
```

---

## 🔐 **Token Types & Security Models**

### **Token Classification & Properties**

| Token Type | Purpose | Lifetime | Storage Location | Security Method | Revocation Strategy |
|------------|---------|----------|------------------|-----------------|-------------------|
| **Access Token** | API Authentication | 15 minutes | Client Memory | JWT (HS256) | Auto-expiry |
| **Refresh Token** | Token Renewal | 7 days | Database (hashed) | bcrypt + JWT | Database deletion |
| **Reset Token** | Password Reset | 15 minutes | Database (hashed) | SHA256 + crypto.randomBytes | Single-use + expiry |

### **Token Security Model Diagram**

```mermaid
graph TB
    subgraph "ACCESS TOKEN SECURITY"
        A1[JWT Structure] --> A2[Header: HS256]
        A2 --> A3[Payload: userId, role, email]
        A3 --> A4[Signature: HMAC-SHA256]
        A4 --> A5[Expiry: 15 minutes]
    end
    
    subgraph "REFRESH TOKEN SECURITY"
        B1[JWT Generation] --> B2[bcrypt Hashing]
        B2 --> B3[Database Storage]
        B3 --> B4[Expiry: 7 days]
        B4 --> B5[Single Token Policy]
    end
    
    subgraph "RESET TOKEN SECURITY"
        C1[crypto.randomBytes] --> C2[SHA256 Hashing]
        C2 --> C3[Database Storage]
        C3 --> C4[Single Use Flag]
        C4 --> C5[Expiry: 15 minutes]
    end
    
    A5 --> D[Token Validation Engine]
    B5 --> D
    C5 --> D
    D --> E[Security Enforcement]
```

### **Token Generation Patterns**

```typescript
// Access Token Structure (JWT Payload)
interface AccessTokenPayload {
    userId: string;
    role: 'STUDENT' | 'TUTOR' | 'ADMIN';
    email: string;
    iat: number;  // Issued at
    exp: number;  // Expires at
}

// Refresh Token Database Schema
interface IRefreshToken {
    userId: string;        // User reference
    tokenHash: string;     // bcrypt hashed token
    expiresAt: Date;       // 7 days from creation
    createdAt: Date;       // Timestamp
}

// Reset Token Database Schema
interface IPasswordResetToken {
    userId: string;        // User reference
    tokenHash: string;     // SHA256 hashed token
    expiresAt: Date;       // 15 minutes from creation
    used: boolean;         // Single-use flag
    createdAt: Date;       // Timestamp
}
```

---

## 🏗️ **Clean Architecture Layers**

### **Layer 1: Presentation Layer (Controllers)**

```mermaid
graph TB
    subgraph "TOKEN CONTROLLERS"
        A1[AuthController.refresh] --> A2[AuthController.logout]
        A2 --> A3[AuthController.forgotPassword]
        A3 --> A4[AuthController.resetPassword]
    end
    
    subgraph "RESPONSIBILITIES"
        B1[HTTP Request Handling] --> B2[Input Validation]
        B2 --> B3[Error Response Formatting]
        B3 --> B4[Success Response Formatting]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
```

**Controller Endpoints & Responsibilities:**

```typescript
// Token Management Endpoints
POST /api/auth/refresh        → Issue new access token
POST /api/auth/logout         → Revoke all refresh tokens
POST /api/auth/forgot-password → Generate reset token
POST /api/auth/reset-password → Validate reset token & update password

// Middleware Applied:
- rateLimiter (100 req/15min)
- authenticate (for logout)
- inputValidation (Zod schemas)
```

### **Layer 2: Application Layer (Services)**

```mermaid
graph TB
    subgraph "TOKEN SERVICES"
        A1[AuthService] --> A2[TokenGenerationService]
        A2 --> A3[TokenValidationService]
        A3 --> A4[TokenRevocationService]
        A4 --> A5[TokenCleanupService]
    end
    
    subgraph "BUSINESS LOGIC"
        B1[Token Lifecycle Management] --> B2[Security Policy Enforcement]
        B2 --> B3[Cross-Service Coordination]
        B3 --> B4[Event Triggering]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B2
    A4 --> B3
    A5 --> B4
```

**Service Layer Implementation Patterns:**

```typescript
export class AuthService {
    // Dual-token generation
    private static async generateTokens(userId: string, role: UserRole, email: string) {
        const accessToken = jwt.sign(
            { userId, role, email },
            jwtConfig.accessSecret,
            { expiresIn: jwtConfig.accessExpiry } // 15m
        );
        
        const refreshToken = jwt.sign(
            { userId },
            jwtConfig.refreshSecret,
            { expiresIn: jwtConfig.refreshExpiry } // 7d
        );
        
        return { accessToken, refreshToken };
    }
    
    // Token refresh logic
    static async refreshAccessToken(refreshToken: string) {
        // 1. Verify JWT signature
        const payload = jwt.verify(refreshToken, jwtConfig.refreshSecret);
        
        // 2. Validate user status
        const user = await AuthRepository.findById(payload.userId);
        if (!user || !user.isActive) throw new Error('User inactive');
        
        // 3. Verify token exists in database
        const storedToken = await AuthRepository.findRefreshTokenByCompare(
            user._id.toString(), 
            refreshToken
        );
        if (!storedToken) throw new Error('Invalid refresh token');
        
        // 4. Generate new access token only
        const accessToken = jwt.sign(
            { userId: user._id.toString(), role: user.role, email: user.email },
            jwtConfig.accessSecret,
            { expiresIn: jwtConfig.accessExpiry }
        );
        
        return { accessToken };
    }
    
    // Token revocation (logout)
    static async logout(userId: string) {
        await AuthRepository.deleteRefreshToken(userId);
        return { message: 'Logged out successfully' };
    }
}
```

### **Layer 3: Domain Layer (Models & Business Rules)**

```mermaid
graph TB
    subgraph "TOKEN ENTITIES"
        A1[User Entity] --> A2[RefreshToken Entity]
        A2 --> A3[PasswordResetToken Entity]
        A3 --> A4[Token Validation Rules]
    end
    
    subgraph "BUSINESS RULES"
        B1[Single Refresh Token Policy] --> B2[Token Expiry Rules]
        B2 --> B3[Reset Token Single-Use]
        B3 --> B4[User Account Status Check]
    end
    
    A4 --> B1
```

### **Layer 4: Infrastructure Layer (Repositories)**

```mermaid
graph TB
    subgraph "TOKEN REPOSITORIES"
        A1[AuthRepository] --> A2[RefreshTokenRepository]
        A2 --> A3[ResetTokenRepository]
        A3 --> A4[TokenHashingService]
    end
    
    subgraph "DATA OPERATIONS"
        B1[CRUD Operations] --> B2[Hash Comparison]
        B2 --> B3[Expiry Cleanup]
        B3 --> B4[Batch Operations]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B2
    A4 --> B2
```

**Repository Implementation Patterns:**

```typescript
export class AuthRepository {
    // Store refresh token (single token policy)
    static async storeRefreshToken(userId: string, token: string, expiresAt: Date) {
        // Delete old tokens (enforce single token)
        await RefreshToken.deleteMany({ userId });
        
        // Hash new token with bcrypt
        const tokenHash = await bcrypt.hash(token, 10);
        
        // Store hashed token
        await RefreshToken.create({
            userId,
            tokenHash,
            expiresAt
        });
    }
    
    // Secure token comparison
    static async findRefreshTokenByCompare(userId: string, rawToken: string) {
        const storedTokens = await RefreshToken.find({
            userId,
            expiresAt: { $gt: new Date() }
        });
        
        for (const stored of storedTokens) {
            const isMatch = await bcrypt.compare(rawToken, stored.tokenHash);
            if (isMatch) return stored;
        }
        
        return null;
    }
    
    // Password reset token management
    static async createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
        // Invalidate old reset tokens
        await PasswordResetToken.updateMany(
            { userId, used: false },
            { used: true }
        );
        
        // Hash token with SHA256
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        // Store new token
        await PasswordResetToken.create({
            userId,
            tokenHash,
            expiresAt,
            used: false
        });
    }
}
```

---

## 🔄 **Token Flow Diagrams**

### **Token Refresh Flow Sequence**

```mermaid
sequenceDiagram
    participant C as Flutter Client
    participant API as Express API
    participant MW as Middleware
    participant AS as AuthService
    participant AR as AuthRepository
    participant DB as MongoDB
    
    Note over C,DB: Access Token Expired - Refresh Flow
    
    C->>API: API Request with expired access token
    API->>MW: authenticate middleware
    MW->>MW: jwt.verify(accessToken) → EXPIRED
    MW-->>API: 401 Token Expired
    API-->>C: 401 Unauthorized
    
    Note over C,DB: Client Initiates Token Refresh
    
    C->>API: POST /api/auth/refresh {refreshToken}
    API->>MW: Rate limiting check
    MW->>AS: AuthService.refreshAccessToken(refreshToken)
    
    Note over AS,DB: Token Validation Process
    
    AS->>AS: jwt.verify(refreshToken, refreshSecret)
    
    alt Invalid/Expired Refresh Token
        AS-->>API: Error: Invalid token
        API-->>C: 401 Unauthorized - Please login
    else Valid Refresh Token
        AS->>AR: AuthRepository.findById(userId)
        AR->>DB: Query users collection
        DB-->>AR: User document
        
        AS->>AS: Validate user.isActive
        alt User Inactive
            AS-->>API: Error: Account deactivated
            API-->>C: 403 Forbidden
        else User Active
            AS->>AR: AuthRepository.findRefreshTokenByCompare()
            AR->>DB: Query refreshtokens collection
            AR->>AR: bcrypt.compare(refreshToken, storedHash)
            
            alt Token Not Found in Database
                AR-->>AS: null
                AS-->>API: Error: Invalid refresh token
                API-->>C: 401 Unauthorized - Please login
            else Token Valid
                AS->>AS: Generate new accessToken
                AS-->>API: { accessToken }
                API-->>C: 200 OK { accessToken }
                
                Note over C: Client updates access token
                C->>API: Retry original API request
                API->>MW: authenticate with new token
                MW-->>API: Authentication successful
                API-->>C: Original API response
            end
        end
    end
```

### **Token Revocation Flow Sequence**

```mermaid
sequenceDiagram
    participant C as Flutter Client
    participant API as Express API
    participant AS as AuthService
    participant AR as AuthRepository
    participant DB as MongoDB
    
    Note over C,DB: User Logout - Token Revocation
    
    C->>API: POST /api/auth/logout
    API->>MW: authenticate middleware
    MW->>MW: Extract userId from access token
    MW->>AS: AuthService.logout(userId)
    
    AS->>AR: AuthRepository.deleteRefreshToken(userId)
    AR->>DB: DELETE FROM refreshtokens WHERE userId = ?
    DB-->>AR: Deletion confirmation
    AR-->>AS: Tokens revoked
    AS-->>API: { message: "Logged out successfully" }
    API-->>C: 200 OK - Logout successful
    
    Note over C: Client clears local tokens
    C->>C: Clear accessToken & refreshToken
    
    Note over C,DB: Password Reset - Force Token Revocation
    
    C->>API: POST /api/auth/reset-password {token, newPassword}
    API->>AS: AuthService.resetPassword(dto)
    
    AS->>AR: AuthRepository.findPasswordResetToken(token)
    AR->>DB: Query passwordresettokens
    DB-->>AR: Valid reset token
    
    AS->>AR: AuthRepository.updatePassword(userId, newHash)
    AR->>DB: UPDATE users SET passwordHash = ?
    
    Note over AS,DB: Security Policy: Revoke All Sessions
    
    AS->>AR: AuthRepository.deleteRefreshToken(userId)
    AR->>DB: DELETE FROM refreshtokens WHERE userId = ?
    
    AS->>AR: AuthRepository.markResetTokenAsUsed(tokenId)
    AR->>DB: UPDATE passwordresettokens SET used = true
    
    AS-->>API: Password reset successful
    API-->>C: 200 OK - Password updated, please login again
```

### **Password Reset Token Flow**

```mermaid
sequenceDiagram
    participant C as Flutter Client
    participant API as Express API
    participant AS as AuthService
    participant AR as AuthRepository
    participant ES as EmailService
    participant DB as MongoDB
    
    Note over C,DB: Password Reset Request
    
    C->>API: POST /api/auth/forgot-password {email}
    API->>AS: AuthService.forgotPassword(dto)
    
    AS->>AR: AuthRepository.findByEmail(email)
    AR->>DB: Query users collection
    DB-->>AR: User document (or null)
    
    alt User Not Found
        AS-->>C: Generic success message (security)
    else User Found
        AS->>AS: crypto.randomBytes(32).toString('hex')
        AS->>AS: crypto.createHash('sha256').update(token)
        
        AS->>AR: AuthRepository.createPasswordResetToken()
        AR->>DB: Invalidate old tokens + Insert new token
        
        AS->>ES: EmailService.sendPasswordResetEmail()
        ES-->>AS: Email sent (or dev preview URL)
        
        AS-->>API: Success message
        API-->>C: Password reset link sent (if email exists)
    end
    
    Note over C,DB: Password Reset Validation
    
    C->>API: POST /api/auth/reset-password {token, newPassword}
    API->>AS: AuthService.resetPassword(dto)
    
    AS->>AS: Hash token with SHA256
    AS->>AR: AuthRepository.findPasswordResetToken(hashedToken)
    AR->>DB: Query passwordresettokens
    DB-->>AR: Valid token document
    
    alt Invalid/Expired/Used Token
        AS-->>API: Error: Invalid or expired token
        API-->>C: 400 Bad Request
    else Valid Token
        AS->>AR: AuthRepository.updatePassword(userId, newHash)
        AS->>AR: AuthRepository.markResetTokenAsUsed(tokenId)
        AS->>AR: AuthRepository.deleteRefreshToken(userId) // Force re-login
        
        AS-->>API: Password reset successful
        API-->>C: 200 OK - Login with new password
    end
```

---

## 🛡️ **Security Implementation**

### **Multi-Layer Security Architecture**

```mermaid
graph TB
    subgraph "SECURITY LAYERS"
        A1[Transport Security - HTTPS] --> A2[Request Security - Rate Limiting]
        A2 --> A3[Input Security - Validation]
        A3 --> A4[Token Security - JWT Signing]
        A4 --> A5[Storage Security - Hashing]
        A5 --> A6[Access Security - Authorization]
    end
    
    subgraph "TOKEN SECURITY MEASURES"
        B1[HS256 Signing] --> B2[Short Access Token Expiry]
        B2 --> B3[Refresh Token Hashing]
        B3 --> B4[Single Token Policy]
        B4 --> B5[Automatic Cleanup]
    end
    
    A4 --> B1
    A5 --> B3
```

### **Token Security Configuration**

```typescript
// JWT Configuration with Security Best Practices
export const jwtConfig = {
    accessSecret: process.env.JWT_ACCESS_SECRET,   // Separate from refresh
    refreshSecret: process.env.JWT_REFRESH_SECRET, // Different secret key
    accessExpiry: "15m",    // Short-lived (15 minutes)
    refreshExpiry: "7d",    // Longer-lived (7 days)
    resetTokenExpiry: "15m", // Very short (15 minutes)
    algorithm: "HS256"      // HMAC-SHA256 signing
};

// Password hashing configuration
export const bcryptConfig = {
    saltRounds: 10,  // ~100ms hashing time (2024 standard)
};

// Security policies
export const securityPolicies = {
    singleRefreshToken: true,     // One token per user
    forceLogoutOnPasswordReset: true, // Revoke all sessions
    autoCleanupExpiredTokens: true,   // Background cleanup
    strictExpiryValidation: true      // No grace periods
};
```

### **Hashing Strategy Implementation**

```typescript
// Refresh Token Security (bcrypt)
export class RefreshTokenSecurity {
    static async hashToken(token: string): Promise<string> {
        return bcrypt.hash(token, bcryptConfig.saltRounds);
    }
    
    static async compareToken(token: string, hash: string): Promise<boolean> {
        return bcrypt.compare(token, hash);
    }
}

// Reset Token Security (SHA256)
export class ResetTokenSecurity {
    static generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }
    
    static hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}

// Access Token Security (JWT)
export class AccessTokenSecurity {
    static signToken(payload: object): string {
        return jwt.sign(payload, jwtConfig.accessSecret, {
            expiresIn: jwtConfig.accessExpiry,
            algorithm: 'HS256',
            issuer: 'learnmentor-api',
            audience: 'learnmentor-clients'
        });
    }
    
    static verifyToken(token: string): object {
        return jwt.verify(token, jwtConfig.accessSecret, {
            algorithms: ['HS256'],
            issuer: 'learnmentor-api',
            audience: 'learnmentor-clients'
        });
    }
}
```

---

## 💾 **Storage & Persistence Strategy**

### **Database Schema Optimization**

```javascript
// RefreshTokens Collection Schema
{
  _id: ObjectId,
  userId: String,        // Reference to User._id
  tokenHash: String,     // bcrypt hashed refresh token
  expiresAt: Date,       // 7 days from creation
  createdAt: Date        // Timestamp for audit
}

// PasswordResetTokens Collection Schema
{
  _id: ObjectId,
  userId: String,        // Reference to User._id
  tokenHash: String,     // SHA256 hashed reset token
  expiresAt: Date,       // 15 minutes from creation
  used: Boolean,         // Single-use enforcement
  createdAt: Date        // Timestamp for audit
}

// Optimized Indexes
db.refreshtokens.createIndex({ "userId": 1 });                    // User lookup
db.refreshtokens.createIndex({ "expiresAt": 1 });                 // Cleanup queries
db.refreshtokens.createIndex({ "userId": 1, "expiresAt": 1 });    // Compound lookup

db.passwordresettokens.createIndex({ "tokenHash": 1 });           // Token lookup
db.passwordresettokens.createIndex({ "userId": 1 });              // User tokens
db.passwordresettokens.createIndex({ "expiresAt": 1 });           // Cleanup
db.passwordresettokens.createIndex({ "used": 1, "expiresAt": 1 }); // Valid tokens

// TTL Index for Automatic Cleanup
db.refreshtokens.createIndex(
    { "expiresAt": 1 }, 
    { expireAfterSeconds: 0 }  // Automatic deletion at expiry
);

db.passwordresettokens.createIndex(
    { "expiresAt": 1 }, 
    { expireAfterSeconds: 0 }  // Automatic deletion at expiry
);
```

### **Storage Security Patterns**

```mermaid
graph TB
    subgraph "TOKEN STORAGE SECURITY"
        A1[Plain Token Generation] --> A2[Cryptographic Hashing]
        A2 --> A3[Database Storage]
        A3 --> A4[Secure Retrieval]
        A4 --> A5[Hash Comparison]
        A5 --> A6[Validation Result]
    end
    
    subgraph "STORAGE POLICIES"
        B1[No Plain Text Storage] --> B2[Hash Before Insert]
        B2 --> B3[Compare on Lookup]
        B3 --> B4[Automatic Cleanup]
        B4 --> B5[Audit Trail]
    end
    
    A2 --> B2
    A5 --> B3
```

---

## 🧹 **Revocation & Cleanup Mechanisms**

### **Token Revocation Strategies**

```mermaid
graph TB
    subgraph "REVOCATION TRIGGERS"
        A1[User Logout] --> A2[Password Reset]
        A2 --> A3[Account Deactivation]
        A3 --> A4[Security Breach Response]
        A4 --> A5[Token Expiry]
    end
    
    subgraph "REVOCATION ACTIONS"
        B1[Delete Refresh Tokens] --> B2[Mark Reset Tokens Used]
        B2 --> B3[Force Client Re-authentication]
        B3 --> B4[Audit Logging]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    A5 --> B2
```

### **Cleanup Implementation**

```typescript
// Background Cleanup Service
export class TokenCleanupService {
    // Clean expired refresh tokens
    static async cleanupExpiredRefreshTokens(): Promise<void> {
        const result = await RefreshToken.deleteMany({
            expiresAt: { $lt: new Date() }
        });
        console.log(`🧹 Cleaned up ${result.deletedCount} expired refresh tokens`);
    }
    
    // Clean expired reset tokens
    static async cleanupExpiredResetTokens(): Promise<void> {
        const result = await PasswordResetToken.deleteMany({
            $or: [
                { expiresAt: { $lt: new Date() } },
                { used: true, createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            ]
        });
        console.log(`🧹 Cleaned up ${result.deletedCount} expired/used reset tokens`);
    }
    
    // Revoke all tokens for user (security action)
    static async revokeAllUserTokens(userId: string): Promise<void> {
        await Promise.all([
            RefreshToken.deleteMany({ userId }),
            PasswordResetToken.updateMany({ userId, used: false }, { used: true })
        ]);
        console.log(`🔒 Revoked all tokens for user: ${userId}`);
    }
    
    // Scheduled cleanup (run via cron job)
    static async scheduledCleanup(): Promise<void> {
        await Promise.all([
            this.cleanupExpiredRefreshTokens(),
            this.cleanupExpiredResetTokens()
        ]);
    }
}

// Express route for manual cleanup (admin only)
router.post('/admin/cleanup-tokens', 
    authenticate, 
    authorizeRoles('ADMIN'), 
    async (req, res) => {
        await TokenCleanupService.scheduledCleanup();
        res.json({ success: true, message: 'Token cleanup completed' });
    }
);
```

### **Single Token Policy Implementation**

```typescript
// Enforce single refresh token per user
export class SingleTokenPolicy {
    static async enforcePolicy(userId: string, newToken: string): Promise<void> {
        // Delete all existing refresh tokens for user
        await RefreshToken.deleteMany({ userId });
        
        // Store new token (hashed)
        const tokenHash = await bcrypt.hash(newToken, 10);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        await RefreshToken.create({
            userId,
            tokenHash,
            expiresAt
        });
    }
    
    // Check for multiple active tokens (security audit)
    static async auditMultipleTokens(): Promise<string[]> {
        const duplicateUsers = await RefreshToken.aggregate([
            { $group: { _id: "$userId", count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $project: { userId: "$_id", count: 1 } }
        ]);
        
        return duplicateUsers.map(user => user.userId);
    }
}
```

---

## ⚡ **Performance Optimizations**

### **Query Optimization Strategies**

```typescript
// Optimized token queries with projection
export class OptimizedTokenRepository {
    // Fast token lookup with minimal data transfer
    static async findActiveRefreshToken(userId: string): Promise<boolean> {
        const token = await RefreshToken.findOne(
            { 
                userId, 
                expiresAt: { $gt: new Date() } 
            },
            { _id: 1 }  // Project only _id (existence check)
        );
        
        return !!token;
    }
    
    // Batch token operations
    static async cleanupExpiredTokensBatch(batchSize: number = 1000): Promise<number> {
        let totalDeleted = 0;
        let hasMore = true;
        
        while (hasMore) {
            const result = await RefreshToken.deleteMany(
                { expiresAt: { $lt: new Date() } },
                { limit: batchSize }
            );
            
            totalDeleted += result.deletedCount;
            hasMore = result.deletedCount === batchSize;
            
            // Prevent overwhelming the database
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return totalDeleted;
    }
}
```

### **Caching Strategy for Token Validation**

```typescript
// Redis cache for frequently accessed token data
export class TokenCacheService {
    private static cache = new Map<string, any>();
    private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    // Cache user status for token validation
    static async getUserStatus(userId: string): Promise<{isActive: boolean, role: string} | null> {
        const cacheKey = `user_status_${userId}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() < cached.expiry) {
                return cached.data;
            }
        }
        
        const user = await User.findById(userId, { isActive: 1, role: 1 });
        if (!user) return null;
        
        const userData = { isActive: user.isActive, role: user.role };
        this.cache.set(cacheKey, {
            data: userData,
            expiry: Date.now() + this.CACHE_TTL
        });
        
        return userData;
    }
    
    // Invalidate cache on user update
    static invalidateUserCache(userId: string): void {
        this.cache.delete(`user_status_${userId}`);
    }
}
```

---

## 📊 **Monitoring & Analytics**

### **Token Usage Analytics**

```typescript
// Token metrics collection
export class TokenMetricsService {
    // Track token refresh frequency
    static async trackTokenRefresh(userId: string): Promise<void> {
        // Could integrate with metrics service (Prometheus, etc.)
        console.log(`📊 Token refresh: ${userId} at ${new Date().toISOString()}`);
    }
    
    // Monitor suspicious token activity
    static async detectSuspiciousActivity(userId: string): Promise<boolean> {
        const recentRefreshes = await RefreshToken.countDocuments({
            userId,
            createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
        });
        
        // Flag if more than 10 refreshes in an hour
        return recentRefreshes > 10;
    }
    
    // Generate token usage report
    static async generateUsageReport() {
        const stats = await Promise.all([
            RefreshToken.countDocuments({}),
            RefreshToken.countDocuments({ expiresAt: { $lt: new Date() } }),
            PasswordResetToken.countDocuments({ used: false }),
            PasswordResetToken.countDocuments({ used: true })
        ]);
        
        return {
            activeRefreshTokens: stats[0],
            expiredRefreshTokens: stats[1],
            pendingResetTokens: stats[2],
            usedResetTokens: stats[3],
            timestamp: new Date().toISOString()
        };
    }
}
```

---

> **Summary:** This Clean Architecture design provides a comprehensive, secure, and performant token management system with dual-token strategy, robust revocation mechanisms, and automated cleanup processes. The multi-layered security approach ensures token integrity while maintaining excellent system performance and maintainability.