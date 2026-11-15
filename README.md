# Chat Backend

A Node.js-based backend for a chat application.

## Technology Stack
- **Language**: TypeScript
- **Runtime**: Node.js
- **API Framework**: Express.js
- **Database (Relational)**: PostgreSQL (via `pg`)
- **Database (NoSQL)**: Firebase Firestore (via `firebase-admin`)
- **Validation**: Zod

## Prerequisites
- Node.js (v18+)
- PostgreSQL
- Firebase Project

## Installation
1. Install dependencies: `npm install`
2. Configure `.env` using `.env.example`.

## Setup
### PostgreSQL
1. Create a database.
2. Execute `src/config/schema.sql` to initialize tables.

### Firebase
1. Set up a Firebase project and enable Firestore.
2. Generate a Service Account JSON file.
3. Map credentials to `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in `.env`.

## Running the Application
- Development: `npm run dev`
- Production Build: `npm run build`
- Production Start: `npm run start`

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/user/register` | Register a new user |
| GET | `/user/:userId/chats` | List user chats |
| POST | `/chat/create` | Create a 1:1 chat |
| POST | `/chat/:chatId/message/send` | Send a message |
| GET | `/chat/:chatId/messages` | Get chat messages |
| POST | `/chat/:chatId/message/:messageId/read` | Mark message as read |
| POST | `/chat/:chatId/lastseen` | Update last seen message |

### Request Examples

#### POST `/user/register`
`{ "name": "Ketan" }`

#### POST `/chat/create`
`{ "userAId": "uuid", "userBId": "uuid" }`

#### POST `/chat/:chatId/message/send`
`{ "senderId": "uuid", "text": "Hello!" }`

---
*For more info, consult the codebase.*
