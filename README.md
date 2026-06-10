# 🌳 Family Tree Management System

A production-ready full-stack web app for building and managing a private family
tree with a visual, graph-based editor. Each user has their own account and can
only ever see and edit their own data.

## 🚀 One-click deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Kaushikan-26/FamilyTree)

Click the button, sign in to Render, and set the secret env vars (`MONGO_URI`,
`JWT_SECRET`). See [DEPLOYMENT.md](DEPLOYMENT.md) for the full guide.

## ✨ Features

- **Authentication** — register/login with JWT + bcrypt-hashed passwords; every
  API route is protected and scoped to the logged-in user.
- **Member management** — add / edit / delete members (name, gender, date of
  birth, optional photo & bio).
- **Relationship management** — connect members with `parent`, `child`, `spouse`
  or `sibling` links. Self-loops and duplicates (including the equivalent inverse)
  are rejected.
- **Graph visualization (React Flow)** — members are draggable nodes, relationships
  are labelled arrows. Drag a link between two nodes to create a relationship;
  node positions are persisted. Delete an edge to remove a relationship.
- **Relationship Logic Engine** — infers indirect relationships (grandparent,
  uncle/aunt, niece/nephew, cousins "N times removed", and one-hop in-laws) from
  the stored direct links.
- **Search** — filter members by name in the sidebar (and via the API `?search=`).
- **Relationship Finder** — pick any two members and get the textual relationship
  between them (e.g. *"Bob is Alice's grandfather"*).

## 🧱 Tech Stack

| Layer    | Tech                                   |
| -------- | -------------------------------------- |
| Frontend | React (hooks), React Router, React Flow, Axios, Vite |
| Backend  | Node.js, Express                       |
| Database | MongoDB + Mongoose                     |
| Auth     | JWT + bcryptjs                         |

## 📁 Project Structure

```
Family/
├── server/                     # Express + MongoDB API
│   ├── config/db.js            # Mongo connection
│   ├── models/                 # User, Member, Relationship schemas
│   ├── middleware/             # auth (JWT), validation, error handler
│   ├── controllers/            # auth, member, relationship logic
│   ├── routes/                 # /api/auth, /api/members, /api/relationships
│   ├── utils/                  # JWT helper + relationship inference engine
│   ├── server.js               # entry point
│   └── .env.example
└── client/                     # React + Vite frontend
    └── src/
        ├── components/         # Sidebar, FamilyGraph, MemberNode, modals, finder…
        ├── pages/              # Login, Register, Dashboard
        ├── services/           # axios API wrappers
        ├── hooks/              # useFamilyData
        └── context/            # AuthContext
```

## 🔌 API

| Method | Endpoint                                   | Description                          |
| ------ | ------------------------------------------ | ------------------------------------ |
| POST   | `/api/auth/register`                       | Create account, returns JWT          |
| POST   | `/api/auth/login`                          | Login, returns JWT                   |
| GET    | `/api/members?search=`                     | List own members (optional search)   |
| POST   | `/api/members`                             | Create member                        |
| PUT    | `/api/members/:id`                         | Update member                        |
| DELETE | `/api/members/:id`                         | Delete member (+ its relationships)  |
| GET    | `/api/relationships`                       | List own relationships               |
| POST   | `/api/relationships`                       | Create relationship                  |
| DELETE | `/api/relationships/:id`                   | Delete relationship                  |
| GET    | `/api/relationships/between/:aId/:bId`     | Inferred relationship of B to A      |

All routes except the two auth endpoints require an `Authorization: Bearer <token>` header.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
# edit .env and set a real JWT_SECRET (and MONGO_URI if not local)
npm run dev                 # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
npm run dev                 # starts on http://localhost:5173
```

Open http://localhost:5173, register an account, and start adding members.

## 🧭 How to Use the Graph

1. Click **+ Add Member** to create people — they appear as nodes.
2. Drag from the **bottom handle** of one node to the **top handle** of another
   to create a relationship; choose the type in the prompt.
   - A `parent` edge means *source is the parent of target*.
3. Drag nodes to rearrange; positions are saved automatically.
4. Select an edge and press **Delete/Backspace** to remove a relationship.
5. Use the **Relationship Finder** in the sidebar to discover how any two
   members are related.

## 🔐 Security Notes

- Passwords are hashed with bcrypt; only the hash is stored.
- JWT auth middleware protects every data route.
- All queries are scoped by `userId`, so users can never access others' data.
- Inputs are validated server-side with `express-validator` and Mongoose schemas.
- Set a strong, unique `JWT_SECRET` in production.
