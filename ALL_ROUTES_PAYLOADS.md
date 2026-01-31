# 📚 FINAL API REFERENCE (Routes & Unique Payloads)

Use these **exact payloads** to test your system. I have used unique emails and passwords so you won't get "Email already exists" errors.

---

## 🚫 COMMON MISTAKE
**Do NOT use `POST` for the profile route.**
- ❌ `POST /api/profile` -> **Error: Cannot POST**
- ✅ `PUT /api/profile` -> **Success**

---

## 1. AUTHENTICATION (Register & Login)

### ✅ A. Register a Student (Default)
**Method:** `POST`
**URL:** `http://localhost:4000/api/auth/register`
**Body (JSON):**
```json
{
  "email": "student_01@example.com",
  "password": "securePass123"
}
```

### ✅ B. Register a Tutor
**Method:** `POST`
**URL:** `http://localhost:4000/api/auth/register/tutor`
**Body (JSON):**
```json
{
  "email": "tutor_01@example.com",
  "password": "tutorPass123"
}
```

### ✅ C. Register an Admin
**Method:** `POST`
**URL:** `http://localhost:4000/api/auth/register/admin`
**Body (JSON):**
```json
{
  "email": "admin_01@example.com",
  "password": "adminPass123"
}
```

### ✅ D. Login (Get Your Token)
**Method:** `POST`
**URL:** `http://localhost:4000/api/auth/login`
**Body (JSON):**
```json
{
  "email": "student_01@example.com",
  "password": "securePass123"
}
```
**Response:** Copy the `accessToken` from the response. You need it for the next steps!

---

## 2. PROFILE MANAGEMENT (Requires Token)

**⚠️ HEADER REQUIRED FOR ALL REQUESTS BELOW:**
`Authorization: Bearer <PASTE_YOUR_TOKEN_HERE>`

### ✅ E. Get Current Profile
**Method:** `GET`
**URL:** `http://localhost:4000/api/profile`
**Body:** None

### ✅ F. Update Profile Details
**Method:** `PUT` (Not POST!)
**URL:** `http://localhost:4000/api/profile`
**Body (Form-Data or JSON):**
```json
{
  "name": "Alex Student",
  "phone": "9876543210",
  "speciality": "Physics Student",
  "address": "456 College Ave"
}
```

### ✅ G. Change Password
**Method:** `PUT`
**URL:** `http://localhost:4000/api/profile`
**Body (Form-Data or JSON):**
```json
{
  "oldPassword": "securePass123",
  "newPassword": "newPassword456"
}
```

### ✅H. Delete Profile Image
**Method:** `DELETE`
**URL:** `http://localhost:4000/api/profile/image`
**Body:** None

---

## 3. SESSION MANAGEMENT

### ✅ I. Refresh Token
**Method:** `POST`
**URL:** `http://localhost:4000/api/auth/refresh`
**Headers:** `Authorization: Bearer <YOUR_REFRESH_TOKEN>`
**Body:** `{}` (Empty JSON)

### ✅ J. Logout
**Method:** `POST`
**URL:** `http://localhost:4000/api/auth/logout`
**Headers:** `Authorization: Bearer <YOUR_ACCESS_TOKEN>`
**Body:** `{}` (Empty JSON)
