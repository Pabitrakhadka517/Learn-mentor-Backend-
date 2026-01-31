# COMPLETE TEST PAYLOADS - Step by Step Guide

## 🎯 Complete Testing Flow for Postman

Follow these steps in order to test the complete authentication and profile system.

---

## STEP 1: Register a New User

### Endpoint
```
POST http://localhost:4000/api/auth/register
```

### Headers
```
Content-Type: application/json
```

### Body (raw JSON)
```json
{
  "email": "testuser@example.com",
  "password": "test123456"
}
```

### Expected Response (201 Created)
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "testuser@example.com",
    "role": "user"
  }
}
```

---

## STEP 2: Login with Registered User

### Endpoint
```
POST http://localhost:4000/api/auth/login
```

### Headers
```
Content-Type: application/json
```

### Body (raw JSON)
```json
{
  "email": "testuser@example.com",
  "password": "test123456"
}
```

### Expected Response (200 OK)
```json
{
  "message": "Logged in successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "testuser@example.com",
    "role": "user"
  }
}
```

**⚠️ IMPORTANT: Copy the `accessToken` value - you'll need it for all profile requests!**

---

## STEP 3: Get Profile (First Time - Empty Profile)

### Endpoint
```
GET http://localhost:4000/api/profile
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN_FROM_STEP_2
```

### Body
```
No body required
```

### Expected Response (200 OK)
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "testuser@example.com",
  "role": "user",
  "createdAt": "2024-01-29T16:30:00.000Z",
  "updatedAt": "2024-01-29T16:30:00.000Z"
}
```

**Note: name, phone, speciality, address, and profileImage will be null/undefined initially**

---

## STEP 4: Update Profile - Basic Info

### Endpoint
```
PUT http://localhost:4000/api/profile
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN_FROM_STEP_2
```

### Body (form-data)
```
KEY                 VALUE                                       TYPE
---                 -----                                       ----
name                John Doe                                    Text
phone               1234567890                                  Text
speciality          Mathematics Teacher                         Text
address             123 Main Street, New York, NY 10001         Text
```

### Expected Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "testuser@example.com",
    "role": "user",
    "name": "John Doe",
    "phone": "1234567890",
    "speciality": "Mathematics Teacher",
    "address": "123 Main Street, New York, NY 10001",
    "createdAt": "2024-01-29T16:30:00.000Z",
    "updatedAt": "2024-01-29T16:35:00.000Z"
  }
}
```

---

## STEP 5: Update Profile - With Image

### Endpoint
```
PUT http://localhost:4000/api/profile
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN_FROM_STEP_2
```

### Body (form-data)
```
KEY                 VALUE                                       TYPE
---                 -----                                       ----
name                Jane Smith                                  Text
phone               9876543210                                  Text
speciality          Physics Teacher                             Text
address             456 Oak Avenue, Los Angeles, CA 90001       Text
profileImage        [Select an image file from your computer]   File
```

### Expected Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "testuser@example.com",
    "role": "user",
    "name": "Jane Smith",
    "phone": "9876543210",
    "speciality": "Physics Teacher",
    "address": "456 Oak Avenue, Los Angeles, CA 90001",
    "profileImage": "https://res.cloudinary.com/demo/image/upload/v1234567890/learnmentor/profiles/abc123.jpg",
    "createdAt": "2024-01-29T16:30:00.000Z",
    "updatedAt": "2024-01-29T16:40:00.000Z"
  }
}
```

---

## STEP 6: Change Password

### Endpoint
```
PUT http://localhost:4000/api/profile
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN_FROM_STEP_2
```

### Body (form-data)
```
KEY                 VALUE                   TYPE
---                 -----                   ----
oldPassword         test123456              Text
newPassword         newpassword789          Text
```

### Expected Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "testuser@example.com",
    "role": "user",
    "name": "Jane Smith",
    "phone": "9876543210",
    "speciality": "Physics Teacher",
    "address": "456 Oak Avenue, Los Angeles, CA 90001",
    "profileImage": "https://res.cloudinary.com/...",
    "createdAt": "2024-01-29T16:30:00.000Z",
    "updatedAt": "2024-01-29T16:45:00.000Z"
  }
}
```

---

## STEP 7: Login with New Password (Verify Password Change)

### Endpoint
```
POST http://localhost:4000/api/auth/login
```

### Headers
```
Content-Type: application/json
```

### Body (raw JSON)
```json
{
  "email": "testuser@example.com",
  "password": "newpassword789"
}
```

### Expected Response (200 OK)
```json
{
  "message": "Logged in successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "testuser@example.com",
    "role": "user"
  }
}
```

---

## STEP 8: Delete Profile Image

### Endpoint
```
DELETE http://localhost:4000/api/profile/image
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Body
```
No body required
```

### Expected Response (200 OK)
```json
{
  "message": "Profile image deleted successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "testuser@example.com",
    "role": "user",
    "name": "Jane Smith",
    "phone": "9876543210",
    "speciality": "Physics Teacher",
    "address": "456 Oak Avenue, Los Angeles, CA 90001",
    "profileImage": null,
    "createdAt": "2024-01-29T16:30:00.000Z",
    "updatedAt": "2024-01-29T16:50:00.000Z"
  }
}
```

---

## STEP 9: Update Everything at Once

### Endpoint
```
PUT http://localhost:4000/api/profile
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Body (form-data)
```
KEY                 VALUE                                       TYPE
---                 -----                                       ----
name                Sarah Johnson                               Text
phone               5551234567                                  Text
speciality          Chemistry Teacher                           Text
address             789 Pine Road, Chicago, IL 60601            Text
oldPassword         newpassword789                              Text
newPassword         finalpassword999                            Text
profileImage        [Select an image file from your computer]   File
```

### Expected Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "email": "testuser@example.com",
    "role": "user",
    "name": "Sarah Johnson",
    "phone": "5551234567",
    "speciality": "Chemistry Teacher",
    "address": "789 Pine Road, Chicago, IL 60601",
    "profileImage": "https://res.cloudinary.com/demo/image/upload/v1234567890/learnmentor/profiles/xyz789.jpg",
    "createdAt": "2024-01-29T16:30:00.000Z",
    "updatedAt": "2024-01-29T16:55:00.000Z"
  }
}
```

---

## 📋 POSTMAN SETUP INSTRUCTIONS

### 1. Create Collection Variables
- Click on your collection
- Go to "Variables" tab
- Add these variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| baseUrl | http://localhost:4000 | http://localhost:4000 |
| token | | (will be set automatically) |

### 2. Auto-Save Token After Login
In the Login request, go to "Tests" tab and add:

```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.collectionVariables.set('token', jsonData.accessToken);
    console.log('Token saved:', jsonData.accessToken);
}
```

### 3. Use Variables in Requests
- URL: `{{baseUrl}}/api/profile`
- Authorization Header: `Bearer {{token}}`

---

## 🔍 COMMON ERROR RESPONSES

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Solution:** Check if token is valid and included in Authorization header

### 400 Validation Error
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
**Solution:** Fix the validation error mentioned in details

### 400 Incorrect Password
```json
{
  "error": "Current password is incorrect"
}
```
**Solution:** Verify you're using the correct old password

### 409 Email Already Exists
```json
{
  "error": "Email already exists"
}
```
**Solution:** Use a different email address for registration

---

## ✅ VALIDATION RULES

| Field | Rule | Example |
|-------|------|---------|
| email | Valid email format | user@example.com |
| password | Min 6 characters | test123456 |
| name | 2-100 characters | John Doe |
| phone | 10-15 digits only | 1234567890 |
| speciality | 2-200 characters | Mathematics Teacher |
| address | 5-500 characters | 123 Main St, NY |
| profileImage | Image file, max 5MB | profile.jpg |

---

## 🚀 QUICK TEST SEQUENCE

**Copy these exact values for quick testing:**

1. **Register:**
   - Email: `quicktest@example.com`
   - Password: `quick123`

2. **Login:**
   - Email: `quicktest@example.com`
   - Password: `quick123`
   - **Save the accessToken!**

3. **Update Profile:**
   - name: `Quick Test User`
   - phone: `1234567890`
   - speciality: `Testing Expert`
   - address: `123 Test St, Test City, TC 12345`

4. **Change Password:**
   - oldPassword: `quick123`
   - newPassword: `quick456`

5. **Login Again:**
   - Email: `quicktest@example.com`
   - Password: `quick456`

---

## 📝 NOTES

- All profile fields are **optional** - you can update just one field if needed
- Password change requires **both** oldPassword and newPassword
- Images are automatically uploaded to Cloudinary and optimized
- Old images are automatically deleted when you upload a new one
- Token expires based on JWT_ACCESS_SECRET configuration
- Use Swagger UI at `http://localhost:4000/swagger` for interactive testing

---

**This is your complete testing guide! Follow the steps in order for best results.** ✅
