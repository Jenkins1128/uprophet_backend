# Uprophet Backend
**A Modernized Social Networking API for Expressive Quotes**

## Overview
**Uprophet** is a full-stack social networking platform that provides users a dedicated space to express themselves by creating and sharing quotes. Originally developed in 2015 using PHP, this backend has been entirely re-engineered into a modern, type-safe **Node.js** and **Express 5** architecture to improve scalability, security, and developer experience.

## Key Features
* **Quote Engine**: Complete CRUD functionality for managing user-generated quotes with image upload support.
* **JWT Authentication**: Secure user sessions using **JSON Web Tokens** (Access & Refresh tokens) with specialized middleware.
* **Zod Validation**: Strict schema validation for all incoming requests ensuring data integrity and type safety.
- **Email Integration**: Automated transactional emails (like welcome messages) powered by **Resend**.
* **Modern ORM**: Type-safe database interactions using **Drizzle ORM** with automated migrations.
* **Production Reliability**: Architected for modern cloud environments like **Railway**.

## Technical Stack
* **Language**: TypeScript 6
* **Server**: Express 5
* **Database**: MySQL (via `mysql2`)
* **ORM**: Drizzle ORM
* **Validation**: Zod
* **Authentication**: JWT (JsonWebToken)
* **Email Service**: Resend
* **File Handling**: Express-FileUpload
* **Middleware**: CORS, Cookie-Parser, Nodemon
* **Hosting**: Railway
---

## Installation & Setup

### 1. Prerequisites
* **Node.js**: Version 20 or higher.
* **MySQL**: A running local or remote instance.
* **Railway Account**: Optional, for cloud deployment.

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/uprophet-backend.git
cd uprophet-backend
```

### 3. Install Dependencies
Run the following command to install the project dependencies:
```bash
npm install
```

### 4. Environment Configuration
Create a `.env` file in the root directory. This project requires the following variables:

```env
# Server Setup
PORT=3001
HOST=localhost
ALLOWED_ORIGINS=http://localhost:3000,https://uprophet.com

# Security & JWT
ACCESS_TOKEN_SECRET=your_access_secret
ACCESS_TOKEN_LIFE=120s
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_LIFE=365d

# Database (Development)
DATABASE_DEV=uprophet
USER_DEV=your_db_user
PASSWORD_DEV=your_db_password

# External Services
RESEND_API_KEY=your_resend_api_key
SITE_KEY=your_site_key
NONCE_SALT=your_nonce_salt
```

### 5. Database Migrations
Initialize your database schema using Drizzle Kit. Ensure your MySQL server is running before executing:
```bash
# Push schema to database
npx drizzle-kit push
```

### 6. Start the Application
To launch the server in development mode with automatic restarts:
```bash
npm run dev
```

To build and start for production:
```bash
npm run build
npm start
```


