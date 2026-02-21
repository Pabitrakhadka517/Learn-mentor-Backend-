# 💬 Real-Time Chat System Documentation

## Overview

The LearnMentor chat system is a real-time messaging feature integrated with the booking lifecycle.
- **Chat Creation**: Automatically created when a Booking status becomes `ACCEPTED` or `PAID`.
- **Access Control**: Only the Student and Tutor of the specific booking can access the chat.
- **Archive**: Chat becomes read-only if booking is `CANCELLED`, `REJECTED`, or `COMPLETED`.

## 📡 Socket.io Connection

### Endpoint
`ws://localhost:4000` (or `wss://api.learnmentor.com` in production)

### Authentication
You must provide the JWT Access Token in the connection handshake.

**Option 1: Auth Header (Recommended)**
```javascript
const socket = io('http://localhost:4000', {
  extraHeaders: {
    Authorization: `Bearer ${token}`
  }
});
```

**Option 2: Auth Object**
```javascript
const socket = io('http://localhost:4000', {
  auth: {
    token: token
  }
});
```

---

## ⚡ Socket Events

### 1️⃣ Join Chat Room
Must be called before sending/receiving messages.

**Client Emits:** `join_room`
```javascript
socket.emit('join_room', { chatId: '65d123...' });
```

**Server Response:**
- Success: `joined_room` -> `{ chatId: '65d123...' }`
- Error: `error` -> `{ message: '...' }`

### 2️⃣ Send Message

**Client Emits:** `send_message`
```javascript
socket.emit('send_message', { 
  chatId: '65d123...', 
  content: 'Hello tutor!', 
  attachments: [] // Optional URLs
});
```

**Server Response:**
- Success (to sender): `message_sent` -> `{ success: true, messageId: '...' }`
- Error: `error` -> `{ message: '...' }`

### 3️⃣ Receive Message
Listen for incoming messages in real-time.

**Server Emits:** `receive_message`
```javascript
socket.on('receive_message', (message) => {
  console.log('New message:', message);
  // {
  //   _id: '...',
  //   content: 'Hello tutor!',
  //   sender: { _id: '...', fullName: '...' },
  //   createdAt: '...'
  // }
});
```

### 4️⃣ Mark Read
Mark messages as read (e.g., when user opens the chat).

**Client Emits:** `mark_read`
```javascript
socket.emit('mark_read', { chatId: '65d123...' });
```

---

## 📚 REST API Endpoints

### 1️⃣ List All Chats
Get a list of all active conversations for the user.

- **GET** `/api/chats`
- **Headers**: `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "chats": [
    {
      "_id": "65d123...",
      "student": { ... },
      "tutor": { ... },
      "lastMessage": "See you then!",
      "lastMessageAt": "2024-02-18T10:00:00Z",
      "isActive": true
    }
  ]
}
```

### 2️⃣ Get Message History
Get paginated messages for a specific chat.

- **GET** `/api/chats/:id/messages?page=1&limit=20`
- **Headers**: `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "messages": [ ... ],
  "total": 50,
  "page": 1,
  "totalPages": 3
}
```

### 3️⃣ Mark Read (API Fallback)
Alternative to socket event for marking messages read.

- **POST** `/api/chats/:id/read`
- **Headers**: `Authorization: Bearer <token>`

---

## 💻 Frontend Implementation Example (React)

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const ChatComponent = ({ chatId, token }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // 1. Initialize Socket
    const newSocket = io('http://localhost:4000', {
      auth: { token }
    });

    setSocket(newSocket);

    // 2. Join Room
    newSocket.emit('join_room', { chatId });

    // 3. Listen for Messages
    newSocket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    
    // 4. Handle Errors
    newSocket.on('error', (err) => {
      console.error('Socket error:', err);
    });

    return () => newSocket.disconnect();
  }, [chatId, token]);

  const sendMessage = () => {
    if (socket && input) {
      socket.emit('send_message', { chatId, content: input });
      setInput('');
    }
  };

  return (
    <div>
      <div className="messages-list">
        {messages.map(msg => (
          <div key={msg._id}>{msg.message}</div>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};
```

## 🔐 Security Protocols

1.  **JWT Auth**: Every socket connection is authenticated.
2.  **Room Authorization**: Only the actual participants (Student/Tutor) can join the room.
3.  **Booking Validation**: Messages can only be sent if the associated Booking is `ACCEPTED` or `PAID`.
4.  **Active Check**: Chat must be `isActive: true`.

---

## ⚠️ Integration Notes

- Ensure `Booking` status is updated correctly.
- If a booking is cancelled, the chat will stop allowing new messages.
- Use pagination API for fetching clean history on initial load, then append new messages via socket.
