# Job/Task Management Module

## Overview

The Job Module implements a comprehensive task management system following Clean Architecture principles. It enables users to create, manage, and track jobs/tasks with integrated payment processing and status management.

## Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                 Presentation Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Controllers │  │   Routes    │  │ Validation  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                 Application Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Use Cases   │  │    DTOs     │  │ Interfaces  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                   Domain Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Entities   │  │ Interfaces  │  │ Value Objs  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│               Infrastructure Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Repositories│  │  Services   │  │  Database   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Features

### Core Functionality
- **Job Creation**: Create new jobs/tasks with validation
- **Status Management**: Track job lifecycle (pending → active → finished/cancelled)
- **Payment Integration**: Handle payment processing and tracking
- **User Access Control**: Role-based permissions (Student/Tutor/Admin)
- **Search & Filtering**: Advanced filtering by status, payment, dates
- **Statistics**: Comprehensive job analytics and metrics

### Business Rules
- Jobs can only be created by authenticated users
- Users cannot create jobs for themselves
- Payment processing requires active job status
- Status transitions follow business logic validation
- Only senders can delete their own jobs
- Admins have extended permissions for management

## API Endpoints

### Job Management
```http
# Get user jobs
GET /api/jobs?status=active&role=sender
Authorization: Bearer {token}

# Get specific job
GET /api/jobs/{jobId}
Authorization: Bearer {token}

# Create new job
POST /api/jobs
Content-Type: application/json
{
  "title": "Math Tutoring Session",
  "description": "Help with calculus homework",
  "receiverId": "userId123",
  "amount": 50.00
}

# Update job status
PATCH /api/jobs/{jobId}/status
Content-Type: application/json
{
  "status": "active"
}

# Process payment
POST /api/jobs/{jobId}/payment
Authorization: Bearer {token}

# Delete job
DELETE /api/jobs/{jobId}
Authorization: Bearer {token}
```

### Statistics & Analytics
```http
# Get job statistics
GET /api/jobs/statistics?role=sender

# Get jobs needing attention
GET /api/jobs/attention
```

## Domain Model

### Job Entity
```typescript
class JobEntity {
  id?: string;
  title: string;
  description?: string;
  senderId: string;     // Job creator
  receiverId: string;   // Job assignee
  amount: number;
  status: JobStatus;    // pending | active | finished | cancelled
  paymentStatus: PaymentStatus; // pending | done | failed
  createdAt: Date;
  updatedAt: Date;
}
```

### Status Flow
```
Job Creation
     ↓
  [pending] ──→ accept ──→ [active] ──→ complete ──→ [finished]
     ↓                        ↓
   cancel                   cancel
     ↓                        ↓
 [cancelled] ←────────────── [cancelled]
```

### Payment Flow
```
Payment Initiation
     ↓
  [pending] ──→ process ──→ [done]
     ↓
   fail
     ↓
  [failed] ──→ retry ──→ [pending]
```

## Use Cases

### 1. Create Job Use Case
**Actor**: Student/Tutor  
**Preconditions**: User is authenticated  
**Flow**:
1. Validate job data
2. Check receiver exists and is different from sender
3. Create job entity with business validation
4. Persist job in repository
5. Return job DTO

### 2. Update Job Status Use Case
**Actor**: Student/Tutor/Admin  
**Preconditions**: User has access to job  
**Flow**:
1. Validate status transition
2. Check user permissions
3. Update job entity status
4. Apply business rules
5. Persist changes

### 3. Process Payment Use Case
**Actor**: Student (sender)  
**Preconditions**: Job is active, user is sender  
**Flow**:
1. Validate payment eligibility
2. Process payment through transaction service
3. Update payment status based on result
4. Handle success/failure scenarios

## Database Schema

```javascript
{
  _id: ObjectId,
  title: String,           // Required, 3-100 chars
  description: String,     // Optional, max 1000 chars
  sender: ObjectId,        // Reference to User
  receiver: ObjectId,      // Reference to User
  amount: Number,          // Required, > 0, <= 10000
  status: String,          // Enum: pending, active, finished, cancelled
  paymentStatus: String,   // Enum: pending, done, failed
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ sender: 1 }
{ receiver: 1 }
{ status: 1, createdAt: -1 }
{ paymentStatus: 1 }
```

## Error Handling

### Standard Error Responses
```typescript
interface ErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
}

// HTTP Status Codes
// 400 - Bad Request (validation errors)
// 401 - Unauthorized (authentication required)
// 403 - Forbidden (insufficient permissions)
// 404 - Not Found (job not found)
// 500 - Internal Server Error
```

### Common Error Scenarios
- **Validation Errors**: Invalid input data
- **Permission Errors**: Insufficient user permissions
- **Business Logic Errors**: Invalid status transitions
- **Payment Errors**: Payment processing failures
- **Database Errors**: Connection or constraint violations

## Security Considerations

### Authentication & Authorization
- All endpoints require JWT authentication
- Role-based access control (RBAC)
- Users can only access their own jobs
- Admins have extended permissions

### Data Validation
- Input sanitization and validation
- SQL injection prevention
- Rate limiting on expensive operations
- Amount limits and business rule enforcement

### Payment Security
- Transaction service integration
- Payment validation and verification
- Audit logging for financial operations
- Secure handling of payment data

## Testing Strategy

### Unit Tests
```typescript
// Entity tests
describe('JobEntity', () => {
  test('should validate job creation');
  test('should enforce business rules');
  test('should handle status transitions');
});

// Use case tests
describe('CreateJobUseCase', () => {
  test('should create valid job');
  test('should reject invalid data');
  test('should prevent self-assignment');
});
```

### Integration Tests
```typescript
// API tests
describe('Job API', () => {
  test('POST /api/jobs should create job');
  test('GET /api/jobs should return user jobs');
  test('PATCH /api/jobs/:id/status should update status');
});
```

### Performance Tests
- Database query performance
- Concurrent job creation/updates
- Payment processing under load
- Memory usage and cleanup

## Monitoring & Observability

### Metrics to Track
- Job creation rate
- Status transition patterns
- Payment success/failure rates
- API response times
- Error rates by endpoint

### Logging
```typescript
// Structured logging
logger.info('Job created', {
  jobId: job.id,
  senderId: job.senderId,
  receiverId: job.receiverId,
  amount: job.amount,
  timestamp: new Date().toISOString()
});
```

### Health Checks
```typescript
// Health endpoint
GET /api/jobs/health
{
  "status": "healthy",
  "checks": {
    "database": true,
    "transactionService": true
  }
}
```

## Integration Points

### Transaction Service
- Payment processing integration
- Transaction record creation
- Refund handling
- Commission calculation

### User Service
- User validation and lookup
- Role verification
- Profile information retrieval

### Notification Service
- Job status change notifications
- Payment completion alerts
- Deadline reminders

## Deployment Considerations

### Environment Variables
```bash
# Transaction service
TRANSACTION_SERVICE_URL=https://api.transactions.local
TRANSACTION_SERVICE_TOKEN=jwt_token_here

# Business configuration
PLATFORM_FEE_PERCENTAGE=5
MAX_JOB_AMOUNT=10000
MIN_JOB_AMOUNT=1

# Database
MONGODB_URI=mongodb://localhost:27017/learnmentor
```

### Dependencies
- MongoDB 4.4+
- Node.js 16+
- Express.js
- Mongoose ODM
- Express Validator
- JWT for authentication

## Future Enhancements

### Planned Features
1. **Job Templates**: Reusable job templates
2. **Recurring Jobs**: Scheduled recurring tasks
3. **File Attachments**: Support for job-related files
4. **Time Tracking**: Built-in time tracking for jobs
5. **Reviews & Ratings**: Job completion feedback
6. **Dispute Resolution**: Conflict management system
7. **Advanced Analytics**: Detailed reporting and insights
8. **Mobile API**: Optimized endpoints for mobile apps

### Technical Improvements
1. **Caching**: Redis caching for frequently accessed data
2. **Queue System**: Async job processing
3. **Event Sourcing**: Complete audit trail
4. **GraphQL**: Alternative query interface
5. **Microservices**: Service decomposition
6. **Real-time Updates**: WebSocket integration

---

## Quick Start Guide

### 1. Installation
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
```

### 2. Integration
```typescript
// app.ts
import { jobRouter } from './modules/job';

app.use('/api/jobs', jobRouter);
```

### 3. Usage Example
```typescript
// Create a job
const response = await fetch('/api/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    title: 'Math Tutoring',
    description: 'Help with algebra',
    receiverId: 'tutor123',
    amount: 50
  })
});

const result = await response.json();
```

### 4. Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

This completes the Job/Task Management Module implementation following Clean Architecture principles with comprehensive feature set, proper error handling, security considerations, and extensive documentation.