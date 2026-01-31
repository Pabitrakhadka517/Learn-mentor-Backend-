# Profile API - Quick Reference Guide

## 🚀 Quick Start

### 1. Setup Cloudinary
```env
# Add to .env file
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 2. Get Your Token
```bash
# Login first
POST http://localhost:4000/api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Copy the accessToken from response
```

---

## 📋 API Endpoints

### Get Profile
```http
GET /api/profile
Authorization: Bearer <your_token>
```

### Update Profile
```http
PUT /api/profile
Authorization: Bearer <your_token>
Content-Type: multipart/form-data

Form Fields:
- name (optional)
- phone (optional)
- speciality (optional)
- address (optional)
- oldPassword (optional)
- newPassword (optional)
- profileImage (file, optional)
```

### Delete Profile Image
```http
DELETE /api/profile/image
Authorization: Bearer <your_token>
```

---

## 💻 Code Examples

### JavaScript/Fetch - Get Profile
```javascript
const token = localStorage.getItem('accessToken');

fetch('http://localhost:4000/api/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => console.log(data));
```

### JavaScript/Fetch - Update Profile
```javascript
const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('phone', '1234567890');
formData.append('profileImage', fileInput.files[0]);

fetch('http://localhost:4000/api/profile', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

### JavaScript/Fetch - Change Password
```javascript
const formData = new FormData();
formData.append('oldPassword', 'current123');
formData.append('newPassword', 'newSecure456');

fetch('http://localhost:4000/api/profile', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

### Axios - Update Profile
```javascript
import axios from 'axios';

const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('profileImage', file);

axios.put('http://localhost:4000/api/profile', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

---

## ✅ Validation Rules

| Field | Type | Rules |
|-------|------|-------|
| name | string | 2-100 characters |
| phone | string | 10-15 digits only |
| speciality | string | 2-200 characters |
| address | string | 5-500 characters |
| oldPassword | string | Required if changing password |
| newPassword | string | Min 6 characters |
| profileImage | file | Images only, max 5MB |

---

## 🔒 Authentication

All endpoints require JWT token in header:
```
Authorization: Bearer <your_access_token>
```

---

## 📦 Response Format

### Success Response
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "...",
    "email": "user@example.com",
    "role": "user",
    "name": "John Doe",
    "phone": "1234567890",
    "speciality": "Mathematics",
    "address": "123 Main St",
    "profileImage": "https://res.cloudinary.com/...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

### Error Response
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "phone",
      "message": "Phone number must be 10-15 digits"
    }
  ]
}
```

---

## 🛠️ Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Validation error / Bad request |
| 401 | Unauthorized (invalid/missing token) |
| 404 | User not found |
| 500 | Server error |

---

## 🐛 Troubleshooting

### "Unauthorized" Error
- Check if token is valid
- Ensure token is in Authorization header
- Login again to get fresh token

### "Only image files are allowed"
- Upload only image files (jpg, png, gif, etc.)
- Check file MIME type

### "Current password is incorrect"
- Verify old password is correct
- Ensure you're using the right account

### Image upload fails
- Check Cloudinary credentials in .env
- Verify file size is under 5MB
- Ensure internet connection is stable

---

## 📚 Full Documentation

For complete documentation, see: `PROFILE_API_DOCUMENTATION.md`

---

## 🧪 Test with Swagger

1. Start server: `npm run dev`
2. Open: `http://localhost:4000/swagger`
3. Login and get token
4. Click "Authorize" and enter: `Bearer <token>`
5. Test endpoints

---

## 📁 Module Structure

```
src/modules/profile/
├── profile.controller.ts    # Request handlers
├── profile.dto.ts           # Validation schemas
├── profile.middleware.ts    # Multer config
├── profile.repository.ts    # Database operations
├── profile.routes.ts        # Route definitions
└── profile.service.ts       # Business logic
```

---

## 🎯 Key Features

✅ Profile CRUD operations  
✅ Image upload to Cloudinary  
✅ Password change with verification  
✅ Input validation  
✅ JWT authentication  
✅ Swagger documentation  
✅ TypeScript support  
✅ Error handling  

---

**Quick Tip:** Use Swagger UI for easy testing and exploration of all endpoints!
