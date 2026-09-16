# 🚀 TaskFlow Pro — Production-Quality Full-Stack Todo Application

**TaskFlow Pro** is a complete, production-ready, full-stack task management web application built from scratch with a clean Node.js + Express backend, persistent SQLite database (`node:sqlite`), robust authentication & user isolation, and a modern, responsive Single Page Application (SPA) frontend.

---

## ✨ Features

- 🔐 **Authentication & Security**:
  - Secure registration & login with salted `scrypt` password hashing
  - JWT session token authentication with protected routes & auto-expiry handling
  - Password recovery flow with expiring single-use reset tokens
  - User profile management & password change
  - **Strict User Data Isolation**: Every database query is scoped to the authenticated user ID (`WHERE user_id = ?`)
- 📝 **Full Todo Management**:
  - Create, Read, Update, Delete (CRUD) tasks with validation
  - Task status tracking (*Pending*, *In Progress*, *Completed*)
  - Priority levels (*High* 🔴, *Medium* 🟡, *Low* 🟢)
  - Due dates with overdue and due-today highlighting
  - Multi-tagging support (relational many-to-many `todo_tags`)
  - Category organization with custom color pickers
  - 1-click completion toggle with `completed_at` timestamps
- 🔍 **Search, Filters & Sorting**:
  - Real-time search across titles, descriptions, and tags (`Ctrl+K` shortcut)
  - Combinable filters: Status + Priority + Category + Tag + Due date
  - Sorting: Newest, Oldest, Due Date, Priority (High to Low), Alphabetical (A-Z)
- 📊 **Productivity Views & Dashboard**:
  - **Dashboard**: Real-time aggregated database statistics, completion rates, priority distribution, and category activity
  - **My Tasks**: Main tasks manager with multi-filter toolbar
  - **Today View**: Dedicated focus on tasks due today and overdue tasks
  - **Upcoming View**: Grouped by Tomorrow, This Week, and Later
  - **Completed View**: Archive with 1-click restore or permanent delete
  - **Categories Manager**: Create, edit colors/names, delete with automatic reassignment
  - **Tags Manager**: Create and delete tags with live task count indicators
- 📱 **Responsive UI/UX**:
  - Desktop, tablet, and mobile optimized with collapsible off-canvas drawer
  - Dark Mode and Light Mode with system preference detection and `localStorage` memory
  - Accessible modal dialogs with keyboard trap (Escape key, outside click)
  - Non-intrusive toast notifications for feedback

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend Runtime** | Node.js (v24 LTS) |
| **Server Framework** | Express.js |
| **Database** | SQLite (using Node's built-in `node:sqlite` DatabaseSync with WAL mode & foreign keys) |
| **Authentication** | Cryptographic salted `scrypt` hashing & HMAC-SHA256 JWT tokens |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5 Semantic SPA, CSS3 Custom Properties |
| **Icons & Fonts** | Lucide Icons, Google Font Plus Jakarta Sans |
| **Testing** | Node.js automated test runner (`tests/run_all.js`) |

---

## ⚡ Quick Start & Running

### 1. Install Dependencies
```powershell
npm install
```

### 2. Seed Demo Data (Optional)
To populate the database with realistic sample categories, tags, and tasks:
```powershell
npm run seed
```

**Development Demo Account Credentials:**
- **Email**: `demo@taskflow.dev`
- **Password**: `DemoPassword123!`

### 3. Start the Application Server
```powershell
npm start
```
The server will start at **[http://localhost:5000](http://localhost:5000)**.

---

## 🧪 Automated Testing

TaskFlow Pro includes a comprehensive automated test suite testing:
1. **Authentication**: Registration, password strength, duplicate emails, login, JWT authorization, protected routes, and forgot/reset password flow.
2. **Todo CRUD & Filters**: Create, read, update, complete/restore, delete, combinable filters, search, and sorting.
3. **Multi-User Data Isolation**: Verifies that User A's data cannot be read, updated, toggled, or deleted by User B.
4. **Categories, Tags & Stats**: Category CRUD, Tag CRUD, and real-time database metric aggregations.

Run the test suite:
```powershell
npm test
```

---

## 📡 API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login & receive JWT
- `GET /api/auth/me` — Fetch authenticated user profile
- `POST /api/auth/forgot-password` — Generate expiring password reset token
- `POST /api/auth/reset-password` — Set new password using reset token

### Todos (`/api/todos`)
- `GET /api/todos` — List todos (supports `?status=&priority=&categoryId=&tagId=&due=&search=&sortBy=`)
- `POST /api/todos` — Create todo
- `GET /api/todos/:id` — Get single todo by ID
- `PUT /api/todos/:id` — Update todo details
- `PATCH /api/todos/:id/toggle` — Toggle completion status
- `DELETE /api/todos/:id` — Delete todo

### Categories (`/api/categories`)
- `GET /api/categories` — List user's categories with task counts
- `POST /api/categories` — Create category
- `PUT /api/categories/:id` — Update category name/color
- `DELETE /api/categories/:id` — Delete category

### Tags (`/api/tags`)
- `GET /api/tags` — List user's tags with task counts
- `POST /api/tags` — Create tag
- `DELETE /api/tags/:id` — Delete tag

### Statistics (`/api/stats`)
- `GET /api/stats` — Get real-time aggregated user stats

### User Profile (`/api/users`)
- `GET /api/users/profile` — Get profile info
- `PUT /api/users/profile` — Update user name
- `POST /api/users/change-password` — Change password with current password check

---

## 🗄️ Database Architecture

```
users (id, name, email, password_hash, created_at, updated_at)
  ├── categories (id, user_id, name, color, created_at, updated_at)
  ├── tags (id, user_id, name, created_at)
  ├── todos (id, user_id, category_id, title, description, status, priority, due_date, completed_at, created_at, updated_at)
  │     └── todo_tags (todo_id, tag_id) [Many-to-Many]
  └── password_reset_tokens (id, user_id, token_hash, expires_at, used, created_at)
```

---

## 🔒 Security Measures Implemented

- **Password Security**: High-iteration `scrypt` hashing with unique per-user cryptographically random 16-byte salt and constant-time comparison (`crypto.timingSafeEqual`).
- **SQL Injection Prevention**: 100% of database queries use parameterized prepared statements.
- **Strict Data Isolation**: Every resource query is scoped with `WHERE user_id = ?`.
- **Session Expiry**: JWT tokens expire after 7 days; password reset tokens expire after 1 hour and are single-use.
- **Account Enumeration Defense**: Generic responses for forgot password requests.