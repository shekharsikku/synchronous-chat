## **Synchronous Chat - Realtime Chat Application**

A real-time chat application built with the `MERN Stack, Socket.IO, Tailwind CSS & ShadcnUI`. It enables the user for chat, share files with other user in realtime.

### **Key Features**

- **Authentication & Authorization** - Secure login and token-based authentication with JWT.

- **Real-time Messaging** – Instant chat updates powered by Socket.IO.

- **Typing Indicators** – See when a user is typing in real time.

- **Contacts Search** – Quickly find contacts with an intuitive search.

- **Status Updates** – View online/offline status of contacts.

- **State Manage** – Managed globally with React Context & Zustand.

- **Data Caching** - Implements client side caching using React Query.

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
cp .env.example .env
```

Copy, `.env.example` file to file name `.env` in the root directory and add the required values:

```env
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

ACCESS_SECRET=""
ACCESS_EXPIRY=""

REFRESH_SECRET=""
REFRESH_EXPIRY=""

COOKIES_SECRET=""
SOCKET_PUBLIC=""
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

---

## **Security Policy**

### **Express Supported Versions**

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 5.1.x   | :white_check_mark: |
| 5.0.x   | :x:                |
| 4.0.x   | :white_check_mark: |
| < 4.0   | :x:                |

```bash
npm install express@latest
```

### **This project is built with - Mongoose v9**.

Using older versions may cause unexpected issues.

```bash
npm install mongoose@latest
```

### **Security Best Practices**

- Use environment variables for sensitive data.
- Regularly update dependencies.
- Follow secure authentication practices.

### **Reporting a Vulnerability**

Use this section to tell people how to report a vulnerability.

Tell them where to go, how often they can expect to get an update on a
reported vulnerability, what to expect if the vulnerability is accepted or
declined, etc.

Found a security issue? Please open an issue!

We appreciate responsible disclosure and will respond promptly.

### **Developer License**

#### MIT License | Developed by [Shekhar Sharma](https://linkedin.com/in/shekharsikku)
