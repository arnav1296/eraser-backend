# eraser-backend# 

✍️ Eraser - Backend (version-1)

This is the backend server for **Eraser**, a real-time collaborative whiteboard app.  
Built using **Node.js**, **Express**, **Prisma ORM**, and **SQLite** for local development.

---

## ✅ Features – Version 1

### 🔐 Authentication
- `POST /auth/google`  
  Authenticate user via Google OAuth and issue JWT token.
- JWT middleware used to protect private routes.

---

### 👤 User Management
- Stores users on first login via Google.
- Fields stored: `id`, `email`, `name`, `createdAt`

---

### 🧩 Board Management
- `POST /boards` – Create a new board (with optional `title`)
- `GET /boards` – List all boards of the logged-in user
- `GET /boards/:id` – Fetch a specific board by ID
- `PATCH /boards/:id` – Rename a board
- `DELETE /boards/:id` – Soft delete a board

---

### 🖊️ Stroke Management
- `POST /boards/:id/strokes` – Save strokes (XY point data) for a board
- `GET /boards/:id/strokes` – Retrieve all strokes for a given board

---

### 🙋 Current User
- `GET /me` – Get authenticated user details from JWT

---

### 🗄️ Database (SQLite via Prisma)
- **Tables:**
  - `users`
  - `boards` (includes soft delete, `title`, `userId`)
  - `strokes` (includes `points`, `boardId`)
- Uses SQLite (`dev.db`) locally — can be swapped with PostgreSQL later

---

## 📦 Tech Stack
- **Node.js** + **Express**
- **Prisma ORM**
- **SQLite** (development)
- **JWT** Authentication
- **Google OAuth** via `@react-oauth/google`

---

## 🚧 Real-time sync is not included in v1
Real-time drawing synchronization (Yjs + WebSocket server) will be introduced in **v2**.

---

## 🧪 Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. Setup .env
#    (JWT_SECRET, etc. — no DB_URL needed for SQLite)

# 3. Generate Prisma client & migrate
npx prisma migrate dev --name init

# 4. Run dev server
npm run dev


API ROUTE OVERVIEW-

| Method | Route                 | Description                 |
| ------ | --------------------- | --------------------------- |
| POST   | `/auth/google`        | Authenticate via Google     |
| GET    | `/me`                 | Get current user            |
| POST   | `/boards`             | Create new board            |
| GET    | `/boards`             | List user’s boards          |
| GET    | `/boards/:id`         | Get a board by ID           |
| PATCH  | `/boards/:id`         | Rename a board              |
| DELETE | `/boards/:id`         | Soft delete a board         |
| POST   | `/boards/:id/strokes` | Save drawing strokes        |
| GET    | `/boards/:id/strokes` | Get all strokes for a board |
