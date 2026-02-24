# Job Module Integration Example

## Quick Integration Guide

### 1. Add Job Module to Main Application

```typescript
// src/app.ts
import express from 'express';
import { JobModule } from './modules/job';

const app = express();

// Initialize Job Module
const jobModule = await JobModule.initialize();

// Add job routes
app.use('/api/jobs', jobModule.getRouter());

// Health check endpoint
app.get('/health/jobs', async (req, res) => {
  const health = await jobModule.healthCheck();
  res.json(health);
});

export default app;
```

### 2. Environment Configuration

```bash
# .env
TRANSACTION_SERVICE_URL=http://localhost:3001/api/transactions
TRANSACTION_SERVICE_TOKEN=your_jwt_token_here
PLATFORM_FEE_PERCENTAGE=5
MAX_JOB_AMOUNT=10000
MIN_JOB_AMOUNT=1
```

### 3. Database Connection

```typescript
// Ensure MongoDB connection is established before using the module
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI!);
console.log('Connected to MongoDB');

// Now initialize job module
const jobModule = await JobModule.initialize();
```

### 4. Frontend Integration Examples

#### Create a Job
```javascript
// Frontend - Create Job
const createJob = async (jobData) => {
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      title: jobData.title,
      description: jobData.description,
      receiverId: jobData.tutorId,
      amount: jobData.amount
    })
  });
  
  return response.json();
};
```

#### Get User Jobs
```javascript
// Frontend - Get Jobs with Filters
const getUserJobs = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.role) params.append('role', filters.role);
  if (filters.search) params.append('search', filters.search);
  
  const response = await fetch(`/api/jobs?${params}`, {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  return response.json();
};
```

#### Update Job Status
```javascript
// Frontend - Update Job Status
const updateJobStatus = async (jobId, newStatus) => {
  const response = await fetch(`/api/jobs/${jobId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      status: newStatus
    })
  });
  
  return response.json();
};
```

#### Process Payment
```javascript
// Frontend - Process Job Payment
const processPayment = async (jobId) => {
  const response = await fetch(`/api/jobs/${jobId}/payment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  return response.json();
};
```

### 5. React Component Example

```jsx
// JobList.jsx
import React, { useState, useEffect } from 'react';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    role: '',
    search: ''
  });
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await getUserJobs(filters);
      if (response.success) {
        setJobs(response.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      const response = await updateJobStatus(jobId, newStatus);
      if (response.success) {
        // Refresh the job list
        fetchJobs();
        alert('Job status updated successfully');
      } else {
        alert(response.message);
      }
    } catch (error) {
      alert('Error updating job status');
    }
  };

  const handlePayment = async (jobId) => {
    try {
      const response = await processPayment(jobId);
      if (response.success) {
        fetchJobs();
        alert('Payment processed successfully');
      } else {
        alert(response.message);
      }
    } catch (error) {
      alert('Error processing payment');
    }
  };

  return (
    <div className="job-list">
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="finished">Finished</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
        <select 
          value={filters.role} 
          onChange={(e) => setFilters({...filters, role: e.target.value})}
        >
          <option value="">All Roles</option>
          <option value="sender">Sent by Me</option>
          <option value="receiver">Received by Me</option>
        </select>
        
        <input
          type="text"
          placeholder="Search jobs..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="jobs">
          {jobs.map(job => (
            <div key={job.id} className="job-card">
              <h3>{job.title}</h3>
              <p>{job.description}</p>
              <div className="job-details">
                <span>Amount: ${job.amount}</span>
                <span>Status: {job.status}</span>
                <span>Payment: {job.paymentStatus}</span>
              </div>
              <div className="job-actions">
                {job.status === 'pending' && (
                  <>
                    <button onClick={() => handleStatusUpdate(job.id, 'active')}>
                      Accept
                    </button>
                    <button onClick={() => handleStatusUpdate(job.id, 'cancelled')}>
                      Cancel
                    </button>
                  </>
                )}
                {job.status === 'active' && job.paymentStatus === 'pending' && (
                  <button onClick={() => handlePayment(job.id)}>
                    Process Payment
                  </button>
                )}
                {job.status === 'active' && (
                  <button onClick={() => handleStatusUpdate(job.id, 'finished')}>
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
```

### 6. Postman Collection

```json
{
  "info": {
    "name": "Job Module API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Job",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Math Tutoring Session\",\n  \"description\": \"Help with calculus problems\",\n  \"receiverId\": \"{{tutorId}}\",\n  \"amount\": 50\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/jobs",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs"]
        }
      }
    },
    {
      "name": "Get User Jobs",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/jobs?status=active&role=sender",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs"],
          "query": [
            {"key": "status", "value": "active"},
            {"key": "role", "value": "sender"}
          ]
        }
      }
    },
    {
      "name": "Get Job by ID",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/jobs/{{jobId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs", "{{jobId}}"]
        }
      }
    },
    {
      "name": "Update Job Status",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"status\": \"active\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/jobs/{{jobId}}/status",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs", "{{jobId}}", "status"]
        }
      }
    },
    {
      "name": "Process Payment",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/jobs/{{jobId}}/payment",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs", "{{jobId}}", "payment"]
        }
      }
    },
    {
      "name": "Get Statistics",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/jobs/statistics",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs", "statistics"]
        }
      }
    },
    {
      "name": "Delete Job",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/jobs/{{jobId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs", "{{jobId}}"]
        }
      }
    }
  ]
}
```

### 7. Testing Examples

```javascript
// test/job.integration.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Job API Integration Tests', () => {
  let authToken;
  let userId;
  let tutorId;
  let jobId;

  beforeAll(async () => {
    // Setup test users and get auth tokens
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test Student',
        email: 'student@test.com',
        password: 'Password123!',
        role: 'Student'
      });
    
    userId = userResponse.body.data._id;
    authToken = userResponse.body.data.token;

    // Create a tutor for testing
    const tutorResponse = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test Tutor',
        email: 'tutor@test.com',
        password: 'Password123!',
        role: 'Tutor'
      });
    
    tutorId = tutorResponse.body.data._id;
  });

  describe('POST /api/jobs', () => {
    test('should create a new job', async () => {
      const jobData = {
        title: 'Math Tutoring',
        description: 'Help with algebra',
        receiverId: tutorId,
        amount: 50
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(jobData.title);
      expect(response.body.data.status).toBe('pending');
      
      jobId = response.body.data.id;
    });

    test('should reject job creation without auth', async () => {
      const jobData = {
        title: 'Math Tutoring',
        receiverId: tutorId,
        amount: 50
      };

      await request(app)
        .post('/api/jobs')
        .send(jobData)
        .expect(401);
    });
  });

  describe('GET /api/jobs', () => {
    test('should get user jobs', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PATCH /api/jobs/:id/status', () => {
    test('should update job status', async () => {
      const response = await request(app)
        .patch(`/api/jobs/${jobId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'active' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });
  });
});
```

This integration guide provides everything needed to quickly integrate and use the Job Module in your application!