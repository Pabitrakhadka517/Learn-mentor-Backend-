# 📚 Tutor Discovery API Documentation

## Overview

The Tutor Discovery module allows students to find, filter, and view verified tutors on the LearnMentor platform.

## Base URL
`/api/tutors`

## 🔐 Authentication
All endpoints require a valid student access token.
Header: `Authorization: Bearer <token>`

---

## 1️⃣ List Tutors (Search & Filter)

**Endpoint:** `GET /api/tutors`

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `subject` | string | Filter by subject (partial match) | `math` |
| `language` | string | Filter by language (partial match) | `spanish` |
| `minPrice` | number | Minimum hourly rate | `20` |
| `maxPrice` | number | Maximum hourly rate | `100` |
| `search` | string | Search by tutor name or bio | `john` |
| `availability`| boolean | Show only tutors with future availability | `true` |
| `sortBy` | string | Sort order (`price_asc`, `price_desc`, `newest`, `rating`) | `price_asc` |
| `page` | number | Page number (default: 1) | `1` |
| `limit` | number | Results per page (default: 10, max: 50) | `10` |

**Request Example:**
```http
GET /api/tutors?subject=math&minPrice=20&maxPrice=100&sortBy=rating&page=1
```

**Response Example:**
```json
{
  "success": true,
  "tutors": [
    {
      "id": "65d123456789...",
      "userId": "65d098765432...",
      "name": "John Doe",
      "email": "john@example.com",
      "profileImage": "https://cloudinary...",
      "bio": "Expert math tutor...",
      "experienceYears": 5,
      "hourlyRate": 45,
      "languages": ["English", "Spanish"],
      "subjects": ["Mathematics", "Physics"],
      "rating": 4.8,
      "reviewsCount": 12,
      "nextAvailableSlot": {
        "startTime": "2024-02-20T10:00:00.000Z",
        "endTime": "2024-02-20T11:00:00.000Z",
        "isBooked": false
      }
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 5
}
```

---

## 2️⃣ Get Tutor Details

**Endpoint:** `GET /api/tutors/:id`

**Response Example:**
```json
{
  "success": true,
  "tutor": {
    "_id": "65d123456789...",
    "user": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "profileImage": "...",
      "location": { "city": "New York", "country": "USA" }
    },
    "bio": "...",
    "experienceYears": 5,
    "hourlyRate": 45,
    "languages": ["English", "Spanish"],
    "subjects": ["Mathematics"],
    "availableSlots": [
      {
        "startTime": "2024-02-20T10:00:00.000Z",
        "endTime": "2024-02-20T11:00:00.000Z",
        "isBooked": false
      },
      ...
    ]
  }
}
```

---

## 🗄️ Database Models

### TutorProfile
- Linked to `User` (userId)
- Stores: bio, experience, rates, subjects, languages
- Indexes: `hourlyRate`, `subjects`, `languages`, `verificationStatus`

### AvailabilitySlot
- Linked to `User` (tutorId)
- Stores: startTime, endTime, isBooked
- Index: `tutorId`, `startTime`

## ⚡ Performance Optimizations

1. **Compound Indexes**: Optimized for common filtering patterns.
2. **Aggregation Pipeline**: Efficiently filters and joins data in a single database query.
3. **Lean Queries**: Uses `.lean()` for read-only operations to reduce overhead.
4. **Pagination**: Server-side pagination handles large datasets.
5. **Projection**: Only returns necessary fields to minimize data transfer.

## 🧪 Seeding Data
To populate the database with test tutors:
```bash
npx ts-node src/modules/tutor/tutor.seeding.ts
```
