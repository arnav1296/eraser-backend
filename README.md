# eraser-backend
# ✍️ Eraser - Backend (version 1)

This is the backend server for **Eraser**, a real-time collaborative whiteboard app.  
Built using **Node.js**, **Express**, **Prisma ORM**, and **PostgreSQL**.

---

## ✅ Features – Version 1

### 🔐 Authentication
- `POST /auth/google`  
  Authenticate user via Google OAuth and issue a JWT token.
- JWT middleware is used to protect private routes.

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

### 🗄️ Database (PostgreSQL via Prisma)
- **Tables:**
  - `users`
  - `boards` (includes soft delete, `title`, `userId`)
  - `strokes` (includes `points`, `boardId`)

---

## 📦 Tech Stack
- **Node.js** + **Express**
- **Prisma ORM**
- **PostgreSQL** (local or hosted)
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

# 2. Setup .env (PostgreSQL URL + JWT secret)

# 3. Generate Prisma client
npx prisma generate

# 4. Run the dev server
npm run dev
