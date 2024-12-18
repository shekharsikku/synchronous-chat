## Synchronous Chat - Realtime Chat Application

### Introduction

Built with the MERN Stack, SocketIO, TailwindCSS, ShadcnUI.
It enable the user for chat with other user in realtime.

### Tech Stack

- React
- Node.js
- Express.js
- MongoDB
- TypeScript
- Tailwind CSS
- ShadcnUI
- Socket.IO

### Features

**Authentication**: Authentication & Authorization with JWT.

**Messaging**: Realtime messaging with SocketIO.

**User Status**: Online user status (SocketIO and React Context).

**State Manage**: Global state management with Zustand.

**Error Handling**: Error handling both on the server and on the client.

### Quick Start

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

### Setup Instructions

**Clone This Repository**

```bash
git clone https://github.com/shekharsikku/synchronous-chat
```

**Install Node Modules**

_for both express server app and client side react app_

```bash
npm install
cd client
npm install
```

**Environment Variables Setup**

Rename, `.env.sample` filename in server dir to `.env` and add all required fields!

```env
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
IPIFY_ADDRESS_URL=""

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

_for run express development server_

```bash
npm run dev
```

_for run react app development server_

```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the project.

```bash
http://localhost:5173
```

**Build App**

_build static file of react application_

```bash
cd client
npm run build
```

**Start App**

_make sure you are in the root dir of project_

```bash
npm run start
```

**Render Frontend**

Open [http://localhost:4000](http://localhost:4000) or `PORT` you added `.env` variable in your browser to view the project.

```bash
http://localhost:4000
```

**Live WebApp**

```bash
https://synchronouschat.onrender.com
```

### Code by [**Shekhar Sharma**](https://github.com/shekharsikku)

---
