# Uprophet Backend
**A Modernized Social Networking API for Expressive Quotes**

## Overview
**Uprophet** is a full-stack social networking platform that provides users a dedicated space to express themselves by creating and sharing quotes. Originally developed in 2015 using PHP, this backend has been entirely re-engineered into a modern **Node.js** and **Express** architecture to improve scalability, security, and performance.

## Key Features
* **Quote Engine**: Complete CRUD (Create, Read, Update, Delete) functionality for managing user-generated quotes.
* **JWT Authentication**: Secure user sessions using **JSON Web Tokens** with a dual-token system (Access & Refresh tokens) for enhanced security.
* **Social Connectivity**: Backend logic to support sharing quotes and connecting with friends within the platform.
* **Relational Data Management**: A robust **MySQL** database schema managed by **Knex.js** for predictable migrations and query building.
* **Production Reliability**: Hosted on **Railway**, ensuring high availability for both the Express server and the MySQL instance.

## Technical Stack
* **Server**: Node.js & Express
* **Database**: MySQL
* **Query Builder**: Knex.js
* **Authentication**: JWT (JsonWebToken)
* **Middleware**: CORS, Cookie-Parser, Nodemon
* **Hosting**: Railway
---

## Installation & Setup

### 1. Prerequisites
* **Node.js**: Version 16 or higher.
* **MySQL**: A running local or remote instance.
* **Railway Account**: Optional, for cloud deployment.

### 2. Clone the Repository
```bash
git clone [https://github.com/your-username/uprophet-backend.git](https://github.com/your-username/uprophet-backend.git)
cd uprophet-backend
```

### 3. Install Dependecies
Run the following command to install the project dependencies, including Express, Knex, and JWT utilities:
```bash
yarn install
```
### 4. Environment Configuration
Create a .env file in the root directory. This project is configured to run on port 3001 and requires the following variables for security and database connectivity:

```env
# Server Setup
PORT=3001
HOST=your_local_host

# Security & JWT
ACCESS_TOKEN_SECRET=your_access_secret
ACCESS_TOKEN_LIFE=120s
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_LIFE=365d

# Database (Development)
DATABASE_DEV=your_db_name
USER_DEV=your_db_user
PASSWORD_DEV=your_db_password
```
### 5. Database Migrations
Initialize your database schema using Knex.js. Ensure your MySQL server is running and matches the credentials in your .env before executing this command:
```bash
npx knex migrate:latest
```

### 6. Start the Application
To launch the server in development mode with automatic restarts via Nodemon:
```bash
yarn start
```


