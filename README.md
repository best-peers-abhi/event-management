# 🎟️ Event Management System (NestJS Microservices)

A distributed **Event Management System** built with **NestJS**, leveraging a **Monorepo** architecture, **TCP-based inter-service RPC communication**, and **event-driven background notifications** via `client.emit()`.

---

## 🏗️ Architecture Overview

The system consists of an **API Gateway** as the single entry point for clients and 3 specialized microservices communicating over internal TCP transport:

```
                                  ┌─────────────────────────┐
                                  │   Client (Web / Mobile) │
                                  └────────────┬────────────┘
                                               │ HTTP (REST)
                                               ▼
                                  ┌─────────────────────────┐
                                  │  API Gateway (Port 3000)│
                                  └────────────┬────────────┘
                                               │
             ┌─────────────────────────────────┼─────────────────────────────────┐
             │ TCP RPC (Port 3002)             │ TCP RPC (Port 3001)             │ TCP RPC (Port 3003)
             ▼                                 ▼                                 ▼
   ┌───────────────────┐             ┌───────────────────┐             ┌───────────────────┐
   │   Auth Service    │             │   User Service    │             │   Event Service   │
   │  - Register/Login │             │  - User Profiles  │             │  - Event CRUD     │
   │  - JWT Signing    │ ───TCP RPC──>  - User Queries   │             │  - Book / Cancel  │
   │  - Password Hash  │             │  - PostgreSQL DB  │             │  - @EventPattern  │
   └───────────────────┘             └───────────────────┘             └───────────────────┘
```

---

## 🚀 Key Features & Capabilities

- **API Gateway**: Single entry point handling HTTP routing, global request logging, JWT authentication verification, and translating RPC exceptions into standard HTTP responses.
- **Authentication Service (`auth-service`)**: Handles user registration, password hashing (`bcrypt`), JWT token generation, and credential validation.
- **User Management Service (`user-service`)**: Manages user entities, profiles, and database operations.
- **Event Management Service (`event-service`)**:
  - Full Event CRUD (Create, Read, Search, Update, Delete).
  - Event Registration & Capacity Management (prevents overbooking).
  - Registration Cancellation & Seat Release.
  - Attendee Listing for Organizers.
- **Asynchronous Event Processing (`client.emit()`)**:
  - Fires background non-blocking events for ticket generation, confirmation emails, and real-time analytics.

---

## 🛠️ Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) (v12) Monorepo
- **Transport**: TCP Protocol via `@nestjs/microservices`
- **Database**: PostgreSQL with [TypeORM](https://typeorm.io/)
- **Security**: Passport, JWT (`@nestjs/jwt`), and `bcrypt`
- **Validation**: `class-validator` and `class-transformer`

---

## 📂 Project Structure

```
event-management/
├── apps/
│   ├── api-gateway/       # HTTP Gateway (Port 3000)
│   │   └── src/
│   │       ├── auth/      # Auth proxy & JWT Guards
│   │       ├── common/    # Logging interceptor & Global exception filter
│   │       ├── event/     # Event & Registration proxy endpoints
│   │       └── user/      # User proxy endpoints
│   ├── auth-service/      # Auth microservice (TCP Port 3002)
│   │   └── src/auth/      # Login, Register, JWT generator
│   ├── user-service/      # User microservice (TCP Port 3001)
│   │   └── src/user/      # User CRUD & Database entity
│   └── event-service/     # Event microservice (TCP Port 3003)
│       └── src/event/     # Event CRUD, Registration, & @EventPattern handlers
├── .env.example           # Template for environment variables
├── nest-cli.json          # Monorepo configuration
└── package.json           # Dependencies and workspace scripts
```

---

## ⚙️ Getting Started & Setup

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** running locally on port `5432`

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=root
DB_DATABASE=event_management
JWT_SECRET=event-management-secret
JWT_EXPIRES_IN=1h
```

Make sure the PostgreSQL database exists:
```sql
CREATE DATABASE event_management;
```

---

## 🏃 Running the Microservices

Open 4 separate terminal windows to run all microservices in development/watch mode:

```bash
# Terminal 1: Start User Service (TCP Port 3001)
npm run start -- user-service --watch

# Terminal 2: Start Auth Service (TCP Port 3002)
npm run start -- auth-service --watch

# Terminal 3: Start Event Service (TCP Port 3003)
npm run start -- event-service --watch

# Terminal 4: Start API Gateway (HTTP Port 3000)
npm run start -- api-gateway --watch
```

---

## 📡 API Reference & Endpoints

Base URL: `http://localhost:3000`

### 1. Authentication Endpoints

#### Register User
`POST /auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

#### Login User
`POST /auth/login`
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```
*Response returns JWT `token` to use in `Authorization: Bearer <token>` for protected routes.*

---

### 2. User Endpoints

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Get all users | Public |
| `GET` | `/users/:id` | Get user by ID | Public |
| `GET` | `/users/email/:email` | Get user by email | Public |

---

### 3. Event Endpoints

#### Browse / Search Events
`GET /event?search=tech`
- **Auth**: Public
- **Query Params**: `search` (optional search by title or location)

#### Get Single Event Details
`GET /event/:id`
- **Auth**: Public
- **Response**: Includes event details, `registeredCount`, and `remainingSeats`.

#### Create Event
`POST /event`
- **Auth**: `Bearer <token>`
```json
{
  "title": "NestJS Microservices Summit 2026",
  "description": "Deep dive into distributed systems with NestJS and TCP",
  "location": "San Francisco, CA & Online",
  "startDate": "2026-10-15T09:00:00.000Z",
  "endDate": "2026-10-15T18:00:00.000Z",
  "capacity": 100
}
```
*Triggers asynchronous background `event.created` notification via `client.emit()`.*

#### Update Event (Organizer Only)
`PATCH /event/:id`
- **Auth**: `Bearer <token>`
```json
{
  "capacity": 150,
  "location": "Hall A - Tech Center"
}
```

#### Delete Event (Organizer Only)
`DELETE /event/:id`
- **Auth**: `Bearer <token>`

---

### 4. Registration & Attendance Endpoints

#### Register for an Event
`POST /event/:id/register`
- **Auth**: `Bearer <token>`
*Verifies seat capacity, saves registration, and triggers asynchronous background `event.registered` via `client.emit()`.*

#### Cancel Registration
`DELETE /event/:id/register`
- **Auth**: `Bearer <token>`
*Cancels registration and frees up a seat.*

#### View Event Attendees (Organizer Only)
`GET /event/:id/attendees`
- **Auth**: `Bearer <token>`

---

## 💡 Key Microservice Concepts Learned

### 1. Synchronous RPC (`client.send()`) vs Asynchronous Events (`client.emit()`)
- **`client.send('pattern', data)`**: Used when the caller requires a response (e.g. creating event, checking capacity, user login). Handled by `@MessagePattern()`.
- **`client.emit('event', data)`**: Used for fire-and-forget tasks (e.g. sending confirmation emails, generating tickets, updating analytics). Handled by `@EventPattern()`.

### 2. Centralized Error Propagation (`RpcException` ➔ `HttpException`)
- Microservices throw `RpcException({ statusCode: 404, message: 'Event not found' })`.
- The Gateway's `GlobalExceptionFilter` intercepts TCP errors and maps them to standard HTTP status codes (`400`, `401`, `404`, `409`, `500`).

---

## 📄 License
This project is open-source and intended for learning microservices with NestJS.

