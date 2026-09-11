# 🎟️ Event Management System (Hybrid Microservices: TCP & Apache Kafka)

A robust, enterprise-grade **Event Management Platform** built with **NestJS**, demonstrating **Hybrid Microservices Communication**. The architecture combines **high-speed Synchronous TCP RPC** for transactional request-response operations with **scalable Asynchronous Apache Kafka Pub/Sub** for decoupled event-driven streaming and broadcasting.

---

## 🏗️ System Architecture

The application adopts a **Hybrid Communication Architecture**:
1. **Synchronous Transport (TCP RPC)**: Used for immediate request-response queries and transactional mutations requiring atomic database validation (e.g., authentication, capacity checks, profile queries).
2. **Asynchronous Transport (Apache Kafka)**: Used for distributed event streaming, fire-and-forget background processing, and pub/sub broadcasting across multiple consumer groups without blocking the client.

```
                                  ┌──────────────────────────┐
                                  │  Client (HTTP / REST)    │
                                  └─────────────┬────────────┘
                                                │ Port 3000
                                                ▼
                                  ┌──────────────────────────┐
                                  │       API Gateway        │
                                  │ (JWT, Proxy & Producer)  │
                                  └──────┬────────────┬──────┘
                                         │            │
            ┌────────────────────────────┘            └────────────────────────────┐
            │ Synchronous TCP RPC                                                  │ Asynchronous Kafka Emit
            ▼                                                                      ▼
 ┌────────────────────────────────────────────────────────┐          ┌──────────────────────────┐
 │                     TCP RPC MESH                       │          │   Apache Kafka Broker    │
 │                                                        │          │     (Port 9092 - KRaft)  │
 │  ┌────────────────┐  ┌───────────────┐  ┌────────────┐ │          └─────────────┬────────────┘
 │  │  Auth Service  │  │ User Service  │  │Event Serv. │ │                        │
 │  │   (Port 3002)  │  │  (Port 3001)  │  │(Port 3003) │ │                        │ Topic: 'event.created'
 │  └───────┬────────┘  └───────▲───────┘  └────────────┘ │                        │ (Fan-out Broadcast)
 │          │                   │                         │                        │
 │          └─────TCP RPC───────┘                         │           ┌────────────┴────────────┐
 └────────────────────────────────────────────────────────┘           ▼                         ▼
                                                           ┌────────────────────┐    ┌────────────────────┐
                                                           │   Event Service    │    │    User Service    │
                                                           │ (Consumer Group:   │    │ (Consumer Group:   │
                                                           │event-service-group)│    │ user-service-group)│
                                                           │ - Email simulation │    │ - Broadcast notice │
                                                           │ - Feed update      │    │ - User prompts     │
                                                           │ - Partition/Offset │    │ - Partition/Offset │
                                                           └────────────────────┘    └────────────────────┘
```

---

## ⚡ Hybrid Communication Model

| Mechanism | Transport Protocol | Pattern | Use Cases | Handlers |
| :--- | :--- | :--- | :--- | :--- |
| **Synchronous RPC** | **TCP** (Ports 3001, 3002, 3003) | Request-Response (`client.send()`) | User Login/Register, Event CRUD, Capacity Validation, Seat Reservation | `@MessagePattern()` |
| **Asynchronous Pub/Sub** | **Apache Kafka** (Broker: `localhost:9092`) | Event Streaming (`kafkaClient.emit()`) | Event Creation Broadcasts, Multi-Service Notifications, Feed Updates | `@EventPattern()` with `KafkaContext` |
| **Async Microservice Emit** | **TCP / In-Process** | Fire-and-Forget (`client.emit()`) | Ticket QR Generation, Real-Time Analytics counters | `@EventPattern()` |

### 🔄 Dual-Phase Execution Workflow (Example: Event Creation)
When a user creates an event (`POST /event`):
1. **Phase 1 (Synchronous TCP RPC)**: The API Gateway sends an RPC message (`events.create`) to `event-service` over TCP (port 3003). `event-service` validates data and commits the record to the PostgreSQL database.
2. **Phase 2 (Asynchronous Kafka Broadcast)**: Upon successful persistence, the API Gateway emits an `event.created` message to the Kafka topic.
   - **`event-service` (Consumer Group: `event-service-group`)** receives the message to trigger organizer confirmation emails, recommendation feed synchronization, and offset tracking.
   - **`user-service` (Consumer Group: `user-service-group`)** independently receives the identical event broadcast to alert users and invite event registrations.

---

## 🚀 Microservices Breakdown

### 1. **API Gateway (`apps/api-gateway`)**
- **Port**: HTTP `3000`
- **Role**: Single entry point for clients, route protection with Passport JWT guards, request logging interceptor, centralized RPC-to-HTTP exception mapping.
- **Transports**: Acts as a TCP client (`ClientProxy`) for all microservices and as a Kafka Producer (`ClientKafka`).

### 2. **Authentication Service (`apps/auth-service`)**
- **Transport**: TCP `Port 3002`
- **Role**: User authentication, password hashing (`bcrypt`), JWT token generation and validation. Communicates with `user-service` over TCP RPC.

### 3. **User Service (`apps/user-service`) — Hybrid**
- **Transports**:
  - **TCP `Port 3001`**: Synchronous user CRUD and profile lookups (`user.create`, `user.findById`, `user.findByEmail`, `user.findAll`).
  - **Kafka Consumer**: Subscribes to topic `event.created` under consumer group `user-service-group`.
- **Database**: PostgreSQL (`users` table).

### 4. **Event Service (`apps/event-service`) — Hybrid**
- **Transports**:
  - **TCP `Port 3003`**: Synchronous event management (`events.create`, `events.findAll`, `events.findOne`, `events.update`, `events.remove`, `events.register`, `events.cancelRegistration`, `events.getAttendees`).
  - **Kafka Consumer**: Subscribes to topic `event.created` under consumer group `event-service-group`.
- **Database**: PostgreSQL (`events` and `event_registrations` tables).
- **Features**: Prevents overbooking, capacity constraints, atomic registration, and seat release.

---

## 🛠️ Technology Stack

- **Core Framework**: [NestJS](https://nestjs.com/) (v12) Monorepo Architecture
- **Transports**:
  - **TCP Protocol**: Native `@nestjs/microservices` TCP transport
  - **Apache Kafka**: `kafkajs` with Kafka KRaft Mode (ZooKeeper-less)
- **Database & ORM**: PostgreSQL with [TypeORM](https://typeorm.io/)
- **Security & Auth**: Passport, JWT (`@nestjs/jwt`), `bcrypt`
- **Validation**: `class-validator` & `class-transformer`
- **Containerization**: Docker Compose for Kafka

---

## 📂 Monorepo Structure

```
event-management/
├── apps/
│   ├── api-gateway/          # HTTP Gateway (Port 3000)
│   │   └── src/
│   │       ├── auth/         # Auth proxy, JWT Guard & Strategy
│   │       ├── common/       # Logging interceptor & GlobalExceptionFilter
│   │       ├── event/        # Event controller (TCP Client + Kafka Producer)
│   │       └── user/         # User proxy controller
│   ├── auth-service/         # Auth Microservice (TCP Port 3002)
│   │   └── src/auth/         # Login, Register, JWT signing
│   ├── user-service/         # Hybrid User Microservice (TCP 3001 + Kafka)
│   │   └── src/user/         # User CRUD & Kafka 'event.created' Consumer
│   └── event-service/        # Hybrid Event Microservice (TCP 3003 + Kafka)
│       └── src/event/        # Event CRUD, Capacity logic & Kafka Consumer
├── docker-compose.yml        # Apache Kafka KRaft Broker
├── .env.example              # Environment variables template
├── nest-cli.json             # Monorepo configuration
└── package.json              # Workspace scripts & dependencies
```

---

## ⚙️ Getting Started & Setup

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** running on port `5432`
- **Docker Desktop** (for running Apache Kafka)

### 2. Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=root
DB_DATABASE=event_management

# Authentication (JWT)
JWT_SECRET=event-management-secret
JWT_EXPIRES_IN=1h

# Kafka Broker Configuration
KAFKA_BROKER=localhost:9092
```

Ensure the PostgreSQL database exists:
```sql
CREATE DATABASE event_management;
```

### 3. Start Apache Kafka (Docker Compose)
The project includes a pre-configured `docker-compose.yml` running Apache Kafka in **KRaft mode** (no ZooKeeper needed):

```bash
docker compose up -d
```

Verify that Kafka broker is running on port `9092`:
```bash
docker ps
```

### 4. Install Dependencies
```bash
npm install
```

---

## 🏃 Running the Microservices

Run each service in watch mode using separate terminal windows:

```bash
# Terminal 1: Start User Service (Hybrid: TCP 3001 + Kafka)
npm run start -- user-service --watch

# Terminal 2: Start Auth Service (TCP 3002)
npm run start -- auth-service --watch

# Terminal 3: Start Event Service (Hybrid: TCP 3003 + Kafka)
npm run start -- event-service --watch

# Terminal 4: Start API Gateway (HTTP Port 3000 + Kafka Producer)
npm run start -- api-gateway --watch
```

---

## 📡 API Reference & Testing Guide

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
*Returns JWT access token. Use in `Authorization: Bearer <token>` for protected endpoints.*

---

### 2. User Endpoints

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Get all registered users | Public |
| `GET` | `/users/:id` | Get user by ID | Public |
| `GET` | `/users/email/:email` | Get user by email | Public |

---

### 3. Event Endpoints (TCP RPC + Kafka Broadcast)

#### Create Event
`POST /event`
- **Auth**: `Bearer <token>`
```json
{
  "title": "NestJS & Kafka Microservices Summit 2026",
  "description": "Deep dive into distributed hybrid microservices with TCP and Kafka KRaft",
  "location": "San Francisco, CA & Online",
  "startDate": "2026-10-15T09:00:00.000Z",
  "endDate": "2026-10-15T18:00:00.000Z",
  "capacity": 100
}
```

> **What happens under the hood?**
> 1. **TCP RPC**: Saved to PostgreSQL database via `event-service`.
> 2. **Kafka Broadcast**: Message published to Kafka topic `event.created`.
> 3. **Consumer Logs**:
>    - `event-service`: Consumes event, extracts topic/partition/offset, logs simulated confirmation email.
>    - `user-service`: Consumes event, extracts metadata, logs notification broadcast.

#### Browse / Search Events
`GET /event?search=Kafka`
- **Auth**: Public
- **Query Params**: `search` (filters by title or location)

#### Get Single Event Details
`GET /event/:id`
- **Auth**: Public
- **Response**: Event details including `registeredCount` and `remainingSeats`.

#### Update Event
`PATCH /event/:id`
- **Auth**: `Bearer <token>` (Creator/Organizer only)
```json
{
  "capacity": 150,
  "location": "Main Auditorium & Online"
}
```

#### Delete Event
`DELETE /event/:id`
- **Auth**: `Bearer <token>` (Creator/Organizer only)

---

### 4. Registration & Attendance Endpoints

#### Register for an Event
`POST /event/:id/register`
- **Auth**: `Bearer <token>`
- Validates seat availability, saves registration, and triggers background notification.

#### Cancel Registration
`DELETE /event/:id/register`
- **Auth**: `Bearer <token>`
- Cancels registration and restores seat availability.

#### View Event Attendees
`GET /event/:id/attendees`
- **Auth**: `Bearer <token>` (Creator/Organizer only)

---

## 💡 Key Microservice Concepts & Implementation Patterns

### 1. Dual-Transport Bootstrap Pattern
NestJS microservices connect multiple transport layers within the same application instance:
```typescript
// Connect TCP RPC
app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
  options: { host: 'localhost', port: 3003 },
});

// Connect Kafka Pub/Sub
app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.KAFKA,
  options: {
    client: { clientId: 'event-service', brokers: ['localhost:9092'] },
    consumer: { groupId: 'event-service-group', allowAutoTopicCreation: true },
  },
});

await app.startAllMicroservices();
```

### 2. Kafka Topic, Partition & Offset Observability
Using `@Ctx() context: KafkaContext`, consumers extract real-time partition metadata:
```typescript
@EventPattern('event.created')
async handleEventCreated(@Payload() data: any, @Ctx() context: KafkaContext) {
  const topic = context.getTopic();
  const partition = context.getPartition();
  const message = context.getMessage();
  this.logger.log(`Consumed from ${topic} [Partition: ${partition}, Offset: ${message.offset}]`);
}
```

### 3. Centralized RPC Exception Propagation
- Microservices throw `RpcException({ statusCode: 404, message: 'Event not found' })`.
- The Gateway's `GlobalExceptionFilter` intercepts TCP RPC errors and transforms them into standard HTTP responses (`400`, `401`, `403`, `404`, `409`, `500`).

---

## 📄 License
This project is open-source and intended for learning microservices architecture with NestJS.
