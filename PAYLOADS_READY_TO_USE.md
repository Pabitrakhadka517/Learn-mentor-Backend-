# Profile API - Ready-to-Use Payloads

## 🎯 Copy & Paste Payloads for Testing

---

## 1️⃣ GET Profile (No Payload Needed)

### cURL Command
```bash
curl -X GET http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### JavaScript/Fetch
```javascript
fetch('http://localhost:4000/api/profile', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 2️⃣ UPDATE Profile - Basic Info Only

### Form Data Payload
```
name=John Doe
phone=1234567890
speciality=Mathematics Teacher
address=123 Main Street, New York, NY 10001
```

### cURL Command
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "name=John Doe" \
  -F "phone=1234567890" \
  -F "speciality=Mathematics Teacher" \
  -F "address=123 Main Street, New York, NY 10001"
```

### JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('phone', '1234567890');
formData.append('speciality', 'Mathematics Teacher');
formData.append('address', '123 Main Street, New York, NY 10001');

fetch('http://localhost:4000/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

### HTML Form
```html
<form id="profileForm">
  <input type="text" name="name" value="John Doe" placeholder="Name">
  <input type="text" name="phone" value="1234567890" placeholder="Phone">
  <input type="text" name="speciality" value="Mathematics Teacher" placeholder="Speciality">
  <textarea name="address" placeholder="Address">123 Main Street, New York, NY 10001</textarea>
  <button type="submit">Update Profile</button>
</form>

<script>
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const response = await fetch('http://localhost:4000/api/profile', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN_HERE'
    },
    body: formData
  });
  
  const result = await response.json();
  console.log(result);
});
</script>
```

---

## 3️⃣ UPDATE Profile - With Image Upload

### Form Data Payload
```
name=Jane Smith
phone=9876543210
speciality=Physics Teacher
address=456 Oak Avenue, Los Angeles, CA 90001
profileImage=[FILE]
```

### cURL Command (with image file)
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "name=Jane Smith" \
  -F "phone=9876543210" \
  -F "speciality=Physics Teacher" \
  -F "address=456 Oak Avenue, Los Angeles, CA 90001" \
  -F "profileImage=@/path/to/your/image.jpg"
```

### JavaScript/Fetch
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
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

### HTML Form with Image
```html
<form id="profileFormWithImage">
  <input type="text" name="name" value="Jane Smith" placeholder="Name">
  <input type="text" name="phone" value="9876543210" placeholder="Phone">
  <input type="text" name="speciality" value="Physics Teacher" placeholder="Speciality">
  <textarea name="address" placeholder="Address">456 Oak Avenue, Los Angeles, CA 90001</textarea>
  <input type="file" name="profileImage" accept="image/*">
  <button type="submit">Update Profile with Image</button>
</form>

<script>
document.getElementById('profileFormWithImage').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const response = await fetch('http://localhost:4000/api/profile', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN_HERE'
    },
    body: formData
  });
  
  const result = await response.json();
  console.log(result);
});
</script>
```

---

## 4️⃣ CHANGE Password Only

### Form Data Payload
```
oldPassword=currentPassword123
newPassword=newSecurePassword456
```

### cURL Command
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "oldPassword=currentPassword123" \
  -F "newPassword=newSecurePassword456"
```

### JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('oldPassword', 'currentPassword123');
formData.append('newPassword', 'newSecurePassword456');

fetch('http://localhost:4000/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

### HTML Form
```html
<form id="passwordForm">
  <input type="password" name="oldPassword" placeholder="Current Password">
  <input type="password" name="newPassword" placeholder="New Password">
  <button type="submit">Change Password</button>
</form>

<script>
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const response = await fetch('http://localhost:4000/api/profile', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN_HERE'
    },
    body: formData
  });
  
  const result = await response.json();
  console.log(result);
});
</script>
```

---

## 5️⃣ UPDATE Everything (Profile + Image + Password)

### Form Data Payload
```
name=Sarah Johnson
phone=5551234567
speciality=Chemistry Teacher
address=789 Pine Road, Chicago, IL 60601
oldPassword=currentPassword123
newPassword=newSecurePassword456
profileImage=[FILE]
```

### cURL Command
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "name=Sarah Johnson" \
  -F "phone=5551234567" \
  -F "speciality=Chemistry Teacher" \
  -F "address=789 Pine Road, Chicago, IL 60601" \
  -F "oldPassword=currentPassword123" \
  -F "newPassword=newSecurePassword456" \
  -F "profileImage=@/path/to/your/image.jpg"
```

### JavaScript/Fetch
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
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

### HTML Complete Form
```html
<form id="completeProfileForm">
  <h3>Profile Information</h3>
  <input type="text" name="name" value="Sarah Johnson" placeholder="Name">
  <input type="text" name="phone" value="5551234567" placeholder="Phone">
  <input type="text" name="speciality" value="Chemistry Teacher" placeholder="Speciality">
  <textarea name="address" placeholder="Address">789 Pine Road, Chicago, IL 60601</textarea>
  
  <h3>Change Password (Optional)</h3>
  <input type="password" name="oldPassword" placeholder="Current Password">
  <input type="password" name="newPassword" placeholder="New Password">
  
  <h3>Profile Image (Optional)</h3>
  <input type="file" name="profileImage" accept="image/*">
  
  <button type="submit">Update Everything</button>
</form>

<script>
document.getElementById('completeProfileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const response = await fetch('http://localhost:4000/api/profile', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN_HERE'
    },
    body: formData
  });
  
  const result = await response.json();
  console.log(result);
});
</script>
```

---

## 6️⃣ DELETE Profile Image

### cURL Command
```bash
curl -X DELETE http://localhost:4000/api/profile/image \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### JavaScript/Fetch
```javascript
fetch('http://localhost:4000/api/profile/image', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

### HTML Button
```html
<button id="deleteImageBtn">Delete Profile Image</button>

<script>
document.getElementById('deleteImageBtn').addEventListener('click', async () => {
  const response = await fetch('http://localhost:4000/api/profile/image', {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN_HERE'
    }
  });
  
  const result = await response.json();
  console.log(result);
});
</script>
```

---

## 🔑 How to Get Your Token

### Step 1: Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Step 2: Copy the accessToken from response
```json
{
  "message": "Logged in successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": { ... }
}
```

### Step 3: Replace YOUR_TOKEN_HERE with the accessToken

---

## 📋 Postman Collection Variables

Set these variables in Postman:

| Variable | Value |
|----------|-------|
| baseUrl | http://localhost:4000 |
| token | YOUR_ACCESS_TOKEN |

Then use:
- `{{baseUrl}}/api/profile`
- `Bearer {{token}}`

---

## 🧪 Test Payloads (Sample Data)

### Tutor Profile
```
name=Dr. Michael Brown
phone=5559876543
speciality=Computer Science & Programming
address=101 Tech Street, San Francisco, CA 94102
```

### Student Profile
```
name=Emily Davis
phone=5551112222
speciality=Mathematics Student
address=202 College Ave, Boston, MA 02115
```

### Admin Profile
```
name=Admin User
phone=5553334444
speciality=System Administrator
address=303 Admin Blvd, Seattle, WA 98101
```

---

## ⚠️ Important Notes

1. **Replace YOUR_TOKEN_HERE** with your actual JWT access token
2. **Replace /path/to/your/image.jpg** with actual image file path
3. **All fields are optional** - send only what you want to update
4. **Password change** requires both oldPassword and newPassword
5. **Phone validation** - must be 10-15 digits only
6. **Image size** - maximum 5MB
7. **Image types** - only image files (jpg, png, gif, etc.)

---

## 🎯 Quick Copy-Paste for Testing

### Test 1: Update Name Only
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "name=Test User"
```

### Test 2: Update Phone Only
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "phone=1234567890"
```

### Test 3: Update Speciality Only
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "speciality=Web Development"
```

### Test 4: Update Address Only
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "address=123 Test Street, Test City"
```

---

**All payloads are ready to use! Just replace YOUR_TOKEN_HERE with your actual token.** 🚀
