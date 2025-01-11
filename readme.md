## **Synchronous Chat - Realtime Chat Application**

Built with the `MERN Stack, Socket.IO, Tailwind CSS & ShadcnUI`. It enable the user for chat, share files with other user in realtime.

### **Key Features**

- **User Authentication:** Secure Authentication & Authorization with JWT.

- **Realtime Messaging:** Instant chat updates powered by Socket.IO.

- **Typing Indicators:** Realtime feedback when a user is typing.

- **Search Contacts:** Find contacts with a user friendly search functionality.

- **Status Updates:** View online/offline status for contacts.

- **State Manage**: Global state management with React Context & Zustand.

- **Schema Validation:** Schema validation in both client & server side with Zod.

- **Error Handling**: Error handling both on the server and on the client.

### **Quick Start**

Make sure you have the following `Git, Node.js, npm` installed on your machine.

### **Setup Instructions**

**Clone This Repository**

```bash
git clone https://github.com/shekharsikku/synchronous-chat
```

**Install Node Modules**

Install for both server side express app and client side react app.

```bash
npm install && cd client && npm install
```

**Environment Variables Setup**

Rename, `.env.sample` filename in server dir to `.env` and add all required fields.

```env
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

ACCESS_SECRET=""
ACCESS_EXPIRY=""

REFRESH_SECRET=""
REFRESH_EXPIRY=""

COOKIES_SECRET=""
PAYLOAD_LIMIT_ALLOWED=""
PORT=""

CORS_ORIGIN=""
MONGODB_URI=""
NODE_ENV=""
```

**Start Development**

Run and start express development server

```bash
npm run dev
```

Run and start react app development server

```bash
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the project.

```bash
http://localhost:5173
```

**Build React App**

Build production static file of react application

```bash
cd client && npm run build
```

**Start Application**

Make sure you are in the root dir of project

```bash
npm run build && npm run start
```

**Render Frontend**

Open [http://localhost:4000](http://localhost:4000) or `PORT` you added in `.env` variable in your browser to view the project.

```bash
http://localhost:4000
```

**Check Live WebApp Deployed On Render**

```bash
https://synchronouschat.onrender.com
```

### **Code by [Shekhar Vishwakarma](https://github.com/shekharsikku)**

---
