## **Synchronous Chat - Realtime Chat Application**

A real-time chat application built with the `MERN Stack, Socket.IO, Tailwind CSS & ShadcnUI`. It enables the user for chat, share files with other user in realtime.

### **Key Features**

- **Authentication & Authorization** - Secure login and token-based authentication with JWT.

- **Real-time Messaging** – Instant chat updates powered by Socket.IO.

- **Typing Indicators** – See when a user is typing in real time.

- **Contacts Search** – Quickly find contacts with an intuitive search.

- **Status Updates** – View online/offline status of contacts.

- **State Manage** – Managed globally with React Context & Zustand.

- **Schema Validation** – Ensures data integrity with Zod on both client and server.

- **Error Handling** – Robust error handling on both frontend and backend.

### **Quick Start**

Ensure you have `Git, Node.js and npm` installed on your machine.

### **Setup Instructions**

**Clone the Repository**

```bash
git clone https://github.com/shekharsikku/synchronous-chat

cd synchronous-chat
```

**Install Dependencies**

Install packages for both the server and client:

```bash
npm install && cd client && npm install
```

**Environment Variables Setup**

```bash
mv .env.sample .env
```

Rename, `.env.sample` to `.env` in the root directory and add the required values:

```env
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

ACCESS_SECRET=""
ACCESS_EXPIRY=""

REFRESH_SECRET=""
REFRESH_EXPIRY=""

COOKIES_SECRET=""
BEFORE_EXPIRES=""
PAYLOAD_LIMIT=""
PORT=""

CORS_ORIGIN=""
MONGODB_URI=""
NODE_ENV=""
```

**Run in Development Mode**

Start the server:

```bash
npm run dev
```

Start the client:

```bash
cd client && npm run dev
```

Then, open below link in your browser.

```bash
http://localhost:5173
```

**Building for Production**

Build React App

```bash
cd client && npm run build
```

**Start the Application**

Ensure you're in the root directory:

```bash
npm run build && npm run start
```

Your app will be available at the port specified in .env.

```bash
http://localhost:<PORT>
```

### **Developed by [Shekhar](https://linkedin.com/in/shekharsikku)**

---
