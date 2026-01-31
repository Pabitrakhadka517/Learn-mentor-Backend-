# Profile API Routes & Payloads Reference

## Base URL
```
http://localhost:4000/api/profile
```

---

## 🔐 Authentication Required
All endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

---

## 📍 Route 1: Get User Profile

### Endpoint
```
GET /api/profile
```

### Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Request Body
```
No body required
```

### Response (200 OK)
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "user",
  "name": "John Doe",
  "phone": "1234567890",
  "speciality": "Mathematics Teacher",
  "address": "123 Main Street, New York, NY 10001",
  "profileImage": "https://res.cloudinary.com/demo/image/upload/v1234567890/learnmentor/profiles/abc123.jpg",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T15:45:00.000Z"
}
```

### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 404 Not Found
{
  "error": "User not found"
}
```

---

## 📍 Route 2: Update Profile (Basic Info Only)

### Endpoint
```
PUT /api/profile
```

### Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "multipart/form-data"
}
```

### Request Payload (Form Data)
```
name: John Doe
phone: 1234567890
speciality: Mathematics Teacher
address: 123 Main Street, New York, NY 10001
```

### cURL Example
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=John Doe" \
  -F "phone=1234567890" \
  -F "speciality=Mathematics Teacher" \
  -F "address=123 Main Street, New York, NY 10001"
```

### JavaScript Example
```javascript
const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('phone', '1234567890');
formData.append('speciality', 'Mathematics Teacher');
formData.append('address', '123 Main Street, New York, NY 10001');

fetch('http://localhost:4000/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

### Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user",
    "name": "John Doe",
    "phone": "1234567890",
    "speciality": "Mathematics Teacher",
    "address": "123 Main Street, New York, NY 10001",
    "profileImage": "https://res.cloudinary.com/...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

---

## 📍 Route 3: Update Profile with Image Upload

### Endpoint
```
PUT /api/profile
```

### Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "multipart/form-data"
}
```

### Request Payload (Form Data)
```
name: Jane Smith
phone: 9876543210
speciality: Physics Teacher
address: 456 Oak Avenue, Los Angeles, CA 90001
profileImage: [File Object] (image file)
```

### cURL Example
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Jane Smith" \
  -F "phone=9876543210" \
  -F "speciality=Physics Teacher" \
  -F "address=456 Oak Avenue, Los Angeles, CA 90001" \
  -F "profileImage=@/path/to/image.jpg"
```

### JavaScript Example
```javascript
const fileInput = document.querySelector('input[type="file"]');
const formData = new FormData();

formData.append('name', 'Jane Smith');
formData.append('phone', '9876543210');
formData.append('speciality', 'Physics Teacher');
formData.append('address', '456 Oak Avenue, Los Angeles, CA 90001');
formData.append('profileImage', fileInput.files[0]);

fetch('http://localhost:4000/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

### Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user",
    "name": "Jane Smith",
    "phone": "9876543210",
    "speciality": "Physics Teacher",
    "address": "456 Oak Avenue, Los Angeles, CA 90001",
    "profileImage": "https://res.cloudinary.com/demo/image/upload/v1234567890/learnmentor/profiles/xyz789.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:15:00.000Z"
  }
}
```

---

## 📍 Route 4: Change Password Only

### Endpoint
```
PUT /api/profile
```

### Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "multipart/form-data"
}
```

### Request Payload (Form Data)
```
oldPassword: currentPassword123
newPassword: newSecurePassword456
```

### cURL Example
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "oldPassword=currentPassword123" \
  -F "newPassword=newSecurePassword456"
```

### JavaScript Example
```javascript
const formData = new FormData();
formData.append('oldPassword', 'currentPassword123');
formData.append('newPassword', 'newSecurePassword456');

fetch('http://localhost:4000/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

### Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user",
    "name": "John Doe",
    "phone": "1234567890",
    "speciality": "Mathematics Teacher",
    "address": "123 Main Street, New York, NY 10001",
    "profileImage": "https://res.cloudinary.com/...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:30:00.000Z"
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Current password is incorrect"
}
```

---

## 📍 Route 5: Update Everything (Profile + Image + Password)

### Endpoint
```
PUT /api/profile
```

### Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "multipart/form-data"
}
```

### Request Payload (Form Data)
```
name: Sarah Johnson
phone: 5551234567
speciality: Chemistry Teacher
address: 789 Pine Road, Chicago, IL 60601
oldPassword: currentPassword123
newPassword: newSecurePassword456
profileImage: [File Object] (image file)
```

### cURL Example
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Sarah Johnson" \
  -F "phone=5551234567" \
  -F "speciality=Chemistry Teacher" \
  -F "address=789 Pine Road, Chicago, IL 60601" \
  -F "oldPassword=currentPassword123" \
  -F "newPassword=newSecurePassword456" \
  -F "profileImage=@/path/to/profile.jpg"
```

### JavaScript Example
```javascript
const fileInput = document.querySelector('input[type="file"]');
const formData = new FormData();

formData.append('name', 'Sarah Johnson');
formData.append('phone', '5551234567');
formData.append('speciality', 'Chemistry Teacher');
formData.append('address', '789 Pine Road, Chicago, IL 60601');
formData.append('oldPassword', 'currentPassword123');
formData.append('newPassword', 'newSecurePassword456');
formData.append('profileImage', fileInput.files[0]);

fetch('http://localhost:4000/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

### Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user",
    "name": "Sarah Johnson",
    "phone": "5551234567",
    "speciality": "Chemistry Teacher",
    "address": "789 Pine Road, Chicago, IL 60601",
    "profileImage": "https://res.cloudinary.com/demo/image/upload/v1234567890/learnmentor/profiles/new123.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:45:00.000Z"
  }
}
```

---

## 📍 Route 6: Delete Profile Image

### Endpoint
```
DELETE /api/profile/image
```

### Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Request Body
```
No body required
```

### cURL Example
```bash
curl -X DELETE http://localhost:4000/api/profile/image \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript Example
```javascript
fetch('http://localhost:4000/api/profile/image', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

### Response (200 OK)
```json
{
  "message": "Profile image deleted successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user",
    "name": "John Doe",
    "phone": "1234567890",
    "speciality": "Mathematics Teacher",
    "address": "123 Main Street, New York, NY 10001",
    "profileImage": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T17:00:00.000Z"
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "No profile image to delete"
}
```

---

## 📋 Complete Payload Field Reference

| Field | Type | Required | Validation | Example |
|-------|------|----------|------------|---------|
| name | string | No | 2-100 chars | "John Doe" |
| phone | string | No | 10-15 digits | "1234567890" |
| speciality | string | No | 2-200 chars | "Mathematics Teacher" |
| address | string | No | 5-500 chars | "123 Main St, NY" |
| oldPassword | string | Conditional* | Min 6 chars | "currentPass123" |
| newPassword | string | No | Min 6 chars | "newPass456" |
| profileImage | file | No | Image, max 5MB | File object |

*Required only when `newPassword` is provided

---

## 🔄 Complete Frontend Integration Examples

### React Hook Example
```jsx
import { useState } from 'react';

function useProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const token = localStorage.getItem('accessToken');
  
  const getProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  const updateProfile = async (formData) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  const deleteProfileImage = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/profile/image', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  return { getProfile, updateProfile, deleteProfileImage, loading, error };
}

export default useProfile;
```

### Axios Service Example
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const profileService = {
  getProfile: async (token) => {
    const response = await axios.get(`${API_BASE_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  },
  
  updateProfile: async (token, formData) => {
    const response = await axios.put(`${API_BASE_URL}/profile`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  deleteProfileImage: async (token) => {
    const response = await axios.delete(`${API_BASE_URL}/profile/image`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  }
};

export default profileService;
```

---

## 🧪 Postman Collection Format

### Collection JSON
```json
{
  "info": {
    "name": "LearnMentor Profile API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/profile",
          "host": ["{{baseUrl}}"],
          "path": ["api", "profile"]
        }
      }
    },
    {
      "name": "Update Profile",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "name",
              "value": "John Doe",
              "type": "text"
            },
            {
              "key": "phone",
              "value": "1234567890",
              "type": "text"
            },
            {
              "key": "speciality",
              "value": "Mathematics Teacher",
              "type": "text"
            },
            {
              "key": "address",
              "value": "123 Main St, NY",
              "type": "text"
            },
            {
              "key": "profileImage",
              "type": "file",
              "src": []
            }
          ]
        },
        "url": {
          "raw": "{{baseUrl}}/api/profile",
          "host": ["{{baseUrl}}"],
          "path": ["api", "profile"]
        }
      }
    },
    {
      "name": "Change Password",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "oldPassword",
              "value": "currentPassword123",
              "type": "text"
            },
            {
              "key": "newPassword",
              "value": "newPassword456",
              "type": "text"
            }
          ]
        },
        "url": {
          "raw": "{{baseUrl}}/api/profile",
          "host": ["{{baseUrl}}"],
          "path": ["api", "profile"]
        }
      }
    },
    {
      "name": "Delete Profile Image",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/profile/image",
          "host": ["{{baseUrl}}"],
          "path": ["api", "profile", "image"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:4000"
    },
    {
      "key": "token",
      "value": "your_token_here"
    }
  ]
}
```

---

## 📝 Summary

### All Routes
1. **GET /api/profile** - Get user profile
2. **PUT /api/profile** - Update profile (supports all fields)
3. **DELETE /api/profile/image** - Delete profile image

### All Payload Fields
- `name` (optional)
- `phone` (optional)
- `speciality` (optional)
- `address` (optional)
- `oldPassword` (conditional)
- `newPassword` (optional)
- `profileImage` (optional file)

### Key Points
- All routes require JWT authentication
- PUT endpoint uses `multipart/form-data`
- All fields are optional in PUT request
- Password change requires both old and new passwords
- Images automatically uploaded to Cloudinary
- Old images automatically deleted when replaced

---

**Last Updated:** January 29, 2026
