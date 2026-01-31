# Profile Management API - Implementation Documentation

## Overview
This document provides comprehensive documentation for the Profile Management API implementation in the LearnMentor backend. The profile module allows users to manage their personal information, upload profile images to Cloudinary, and change their passwords.

---

## Table of Contents
1. [Features](#features)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [API Endpoints](#api-endpoints)
5. [File Structure](#file-structure)
6. [Usage Examples](#usage-examples)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)

---

## Features

### ✅ Implemented Features
- **Get User Profile**: Retrieve authenticated user's profile information
- **Update Profile**: Update user details (name, phone, speciality, address)
- **Image Upload**: Upload profile images to Cloudinary with automatic optimization
- **Password Change**: Securely change password with old password verification
- **Image Management**: Delete profile images from both database and Cloudinary
- **Validation**: Comprehensive input validation using Zod schemas
- **Authentication**: Protected routes using JWT authentication middleware
- **Swagger Documentation**: Complete API documentation

---

## Architecture

### Layered Architecture Pattern
The profile module follows the same architectural pattern as the auth module:

```
┌─────────────────────────────────────────┐
│         profile.routes.ts               │  ← HTTP Routes & Swagger Docs
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│       profile.controller.ts             │  ← Request/Response Handling
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│        profile.service.ts               │  ← Business Logic
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│      profile.repository.ts              │  ← Data Access Layer
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         user.model.ts                   │  ← MongoDB Schema
└─────────────────────────────────────────┘
```

### Additional Components
- **profile.dto.ts**: Data Transfer Objects and validation schemas
- **profile.middleware.ts**: Multer configuration for file uploads
- **cloudinary.ts**: Cloudinary SDK configuration

---

## Setup & Configuration

### 1. Install Dependencies
```bash
npm install multer cloudinary multer-storage-cloudinary
npm install --save-dev @types/multer
```

### 2. Environment Variables
Add the following to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**How to get Cloudinary credentials:**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Replace the placeholder values in `.env`

### 3. User Model Updates
The User model has been extended with the following fields:
- `name`: User's full name (optional)
- `phone`: Phone number (optional)
- `speciality`: User's area of expertise (optional)
- `address`: User's address (optional)
- `profileImage`: Cloudinary URL of profile image (optional)
- `createdAt`: Timestamp (auto-generated)
- `updatedAt`: Timestamp (auto-generated)

---

## API Endpoints

### Base URL
```
http://localhost:4000/api/profile
```

### 1. Get Profile
**Endpoint:** `GET /api/profile`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "user",
  "name": "John Doe",
  "phone": "1234567890",
  "speciality": "Mathematics",
  "address": "123 Main St, City, Country",
  "profileImage": "https://res.cloudinary.com/...",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T15:45:00.000Z"
}
```

---

### 2. Update Profile
**Endpoint:** `PUT /api/profile`

**Authentication:** Required (Bearer Token)

**Content-Type:** `multipart/form-data`

**Request Body (all fields optional):**
```
name: string (2-100 characters)
phone: string (10-15 digits)
speciality: string (2-200 characters)
address: string (5-500 characters)
oldPassword: string (required if changing password)
newPassword: string (min 6 characters)
profileImage: file (image only, max 5MB)
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user",
    "name": "John Doe Updated",
    "phone": "9876543210",
    "speciality": "Physics",
    "address": "456 New St, City, Country",
    "profileImage": "https://res.cloudinary.com/...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

**Validation Rules:**
- `name`: Minimum 2 characters, maximum 100 characters
- `phone`: Must be 10-15 digits (numbers only)
- `speciality`: Minimum 2 characters, maximum 200 characters
- `address`: Minimum 5 characters, maximum 500 characters
- `newPassword`: Requires `oldPassword` to be provided
- `profileImage`: Only image files, maximum 5MB

---

### 3. Delete Profile Image
**Endpoint:** `DELETE /api/profile/image`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "message": "Profile image deleted successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user",
    "name": "John Doe",
    "phone": "1234567890",
    "speciality": "Mathematics",
    "address": "123 Main St, City, Country",
    "profileImage": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:30:00.000Z"
  }
}
```

---

## File Structure

```
src/
├── config/
│   ├── cloudinary.ts          # Cloudinary configuration
│   ├── db.ts                  # Database configuration
│   └── jwt.ts                 # JWT configuration
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.dto.ts
│   │   ├── auth.middleware.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── user.model.ts      # ✅ Updated with profile fields
│   └── profile/
│       ├── profile.controller.ts   # HTTP request handlers
│       ├── profile.dto.ts          # DTOs and validation schemas
│       ├── profile.middleware.ts   # Multer configuration
│       ├── profile.repository.ts   # Database operations
│       ├── profile.routes.ts       # Route definitions
│       └── profile.service.ts      # Business logic
├── app.ts                     # ✅ Updated with profile routes
└── server.ts
```

---

## Usage Examples

### Example 1: Get Profile (JavaScript/Fetch)
```javascript
const token = 'your_jwt_access_token';

fetch('http://localhost:4000/api/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

### Example 2: Update Profile with Image (JavaScript/FormData)
```javascript
const token = 'your_jwt_access_token';
const formData = new FormData();

// Add text fields
formData.append('name', 'John Doe');
formData.append('phone', '1234567890');
formData.append('speciality', 'Mathematics');
formData.append('address', '123 Main St, City, Country');

// Add image file (from file input)
const fileInput = document.querySelector('input[type="file"]');
if (fileInput.files[0]) {
  formData.append('profileImage', fileInput.files[0]);
}

fetch('http://localhost:4000/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

### Example 3: Change Password
```javascript
const token = 'your_jwt_access_token';
const formData = new FormData();

formData.append('oldPassword', 'currentPassword123');
formData.append('newPassword', 'newSecurePassword456');

fetch('http://localhost:4000/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

### Example 4: Update Profile with Image AND Change Password
```javascript
const token = 'your_jwt_access_token';
const formData = new FormData();

// Update profile fields
formData.append('name', 'Jane Smith');
formData.append('phone', '9876543210');

// Change password
formData.append('oldPassword', 'currentPassword123');
formData.append('newPassword', 'newSecurePassword456');

// Upload new profile image
const fileInput = document.querySelector('input[type="file"]');
if (fileInput.files[0]) {
  formData.append('profileImage', fileInput.files[0]);
}

fetch('http://localhost:4000/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

### Example 5: Delete Profile Image
```javascript
const token = 'your_jwt_access_token';

fetch('http://localhost:4000/api/profile/image', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

### Example 6: React Component Example
```jsx
import React, { useState } from 'react';

function ProfileUpdate() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    speciality: '',
    address: '',
    oldPassword: '',
    newPassword: ''
  });
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('accessToken');
    const data = new FormData();
    
    // Add text fields
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    });
    
    // Add image if selected
    if (image) {
      data.append('profileImage', image);
    }
    
    try {
      const response = await fetch('http://localhost:4000/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });
      
      const result = await response.json();
      console.log('Profile updated:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <input
        type="text"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
      />
      <input
        type="text"
        placeholder="Speciality"
        value={formData.speciality}
        onChange={(e) => setFormData({...formData, speciality: e.target.value})}
      />
      <textarea
        placeholder="Address"
        value={formData.address}
        onChange={(e) => setFormData({...formData, address: e.target.value})}
      />
      <input
        type="password"
        placeholder="Old Password"
        value={formData.oldPassword}
        onChange={(e) => setFormData({...formData, oldPassword: e.target.value})}
      />
      <input
        type="password"
        placeholder="New Password"
        value={formData.newPassword}
        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />
      <button type="submit">Update Profile</button>
    </form>
  );
}

export default ProfileUpdate;
```

---

## Error Handling

### Common Error Responses

#### 1. Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```
**Cause:** Missing or invalid JWT token

---

#### 2. Validation Error (400)
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
**Cause:** Invalid input data

---

#### 3. Incorrect Password (400)
```json
{
  "error": "Current password is incorrect"
}
```
**Cause:** Wrong old password provided when changing password

---

#### 4. User Not Found (404)
```json
{
  "error": "User not found"
}
```
**Cause:** User ID from token doesn't exist in database

---

#### 5. No Profile Image (400)
```json
{
  "error": "No profile image to delete"
}
```
**Cause:** Attempting to delete profile image when none exists

---

#### 6. Image Upload Error (500)
```json
{
  "error": "Image upload failed: <error details>"
}
```
**Cause:** Cloudinary upload failure or network issues

---

#### 7. File Type Error (Multer)
```json
{
  "error": "Only image files are allowed!"
}
```
**Cause:** Non-image file uploaded

---

#### 8. File Size Error (Multer)
```json
{
  "error": "File too large"
}
```
**Cause:** Image exceeds 5MB limit

---

## Security Considerations

### 1. Authentication
- All profile endpoints require valid JWT access token
- Token must be sent in `Authorization` header as `Bearer <token>`
- Tokens are verified using `authMiddleware`

### 2. Password Security
- Old password verification required before changing password
- Passwords are hashed using bcrypt with salt rounds of 10
- Password hashes are never returned in API responses

### 3. File Upload Security
- Only image files are accepted (MIME type validation)
- File size limited to 5MB
- Images are automatically optimized and resized by Cloudinary
- Old images are deleted from Cloudinary when replaced

### 4. Data Validation
- All inputs validated using Zod schemas
- Phone numbers must match regex pattern
- String length constraints enforced
- Conditional validation for password changes

### 5. Data Privacy
- Password hashes and refresh tokens excluded from profile responses
- Users can only access/modify their own profile
- User ID extracted from authenticated JWT token

---

## Cloudinary Image Handling

### Upload Configuration
```javascript
{
  folder: 'learnmentor/profiles',
  transformation: [
    { width: 500, height: 500, crop: 'fill' },
    { quality: 'auto' }
  ]
}
```

### Features
- **Automatic Optimization**: Images optimized for web delivery
- **Resizing**: All images resized to 500x500 pixels
- **Cropping**: Smart cropping to maintain aspect ratio
- **Organization**: Images stored in `learnmentor/profiles` folder
- **Cleanup**: Old images automatically deleted when replaced

---

## Testing with Swagger

1. Start the server:
   ```bash
   npm run dev
   ```

2. Open Swagger UI:
   ```
   http://localhost:4000/swagger
   ```

3. Authenticate:
   - Login using `/api/auth/login` endpoint
   - Copy the `accessToken` from response
   - Click "Authorize" button in Swagger UI
   - Enter: `Bearer <your_access_token>`
   - Click "Authorize"

4. Test Profile Endpoints:
   - Try GET `/api/profile` to view your profile
   - Try PUT `/api/profile` to update profile
   - Try DELETE `/api/profile/image` to delete image

---

## Troubleshooting

### Issue 1: Cloudinary Upload Fails
**Solution:** 
- Verify Cloudinary credentials in `.env`
- Check internet connection
- Ensure image file is valid

### Issue 2: "Unauthorized" Error
**Solution:**
- Ensure you're logged in and have a valid token
- Check token expiration
- Verify token is sent in Authorization header

### Issue 3: "Only image files are allowed"
**Solution:**
- Ensure file is an image (jpg, png, gif, etc.)
- Check file MIME type

### Issue 4: Password Change Fails
**Solution:**
- Verify old password is correct
- Ensure both oldPassword and newPassword are provided
- Check password meets minimum length requirement (6 characters)

---

## Next Steps & Enhancements

### Potential Future Features
1. **Image Cropping**: Allow users to crop images before upload
2. **Multiple Images**: Support for gallery/portfolio images
3. **Email Verification**: Verify email when changed
4. **Phone Verification**: SMS verification for phone numbers
5. **Profile Visibility**: Public/private profile settings
6. **Social Links**: Add social media profile links
7. **Bio/Description**: Add user biography field
8. **Profile Completion**: Track profile completion percentage

---

## Summary

The Profile Management API provides a complete solution for user profile management with the following key features:

✅ **Secure Authentication**: JWT-based authentication on all endpoints  
✅ **Image Upload**: Cloudinary integration with automatic optimization  
✅ **Password Management**: Secure password change with verification  
✅ **Comprehensive Validation**: Zod schemas for input validation  
✅ **Error Handling**: Detailed error messages and status codes  
✅ **Documentation**: Complete Swagger API documentation  
✅ **Modular Architecture**: Clean separation of concerns  
✅ **Type Safety**: Full TypeScript implementation  

The implementation follows the existing project structure and patterns, making it easy to maintain and extend.

---

## Contact & Support

For questions or issues:
- Check Swagger documentation at `/swagger`
- Review error messages in API responses
- Verify environment variables are set correctly
- Ensure all dependencies are installed

---

**Document Version:** 1.0  
**Last Updated:** January 29, 2026  
**Author:** LearnMentor Development Team
