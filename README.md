# 🚀 TaskFlow Pro — Premium Modern Frontend Todo Application

**TaskFlow Pro** is a modern, responsive, and standalone task management web application built with clean HTML5, modern CSS3, and Vanilla JavaScript (ES6+).

It features a premium productivity design inspired by Linear, Raycast, and Things 3, with complete **`localStorage` auto-persistence** — making it **100% ready for 1-click static deployment on Vercel**, Netlify, or GitHub Pages with zero backend or database setup required!

---

## 🌐 Live Demo & Deployment on Vercel

To deploy your own live version on Vercel in 60 seconds:

1. Go to **[vercel.com](https://vercel.com)** and log in with your GitHub account.
2. Click **"Add New..."** → **"Project"**.
3. Select this repository (**`Kartik70077/todo-list-web-`**).
4. Click **"Deploy"** (Keep default settings: Root `./`, Framework *Other*).
5. Done! Your site is live with a public URL!

---

## ✨ Features

- 💎 **Premium UI/UX**:
  - Restrained, productivity-focused design system with Dark Mode and Light Mode
  - High-density, tactile task rows with completion checkboxes
  - Keyboard shortcuts:
    - <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> — Focus global search
    - <kbd>N</kbd> — Quick task creation dialog
    - <kbd>Esc</kbd> — Close modals and dialogs
- 📝 **Task Management (Full CRUD)**:
  - Create, edit, complete/restore, and delete tasks
  - Statuses (*Pending*, *In Progress*, *Completed*)
  - Priority levels (*High* 🔴, *Medium* 🟡, *Low* 🟢)
  - Due date tracking with automatic Overdue and Due-Today highlighting
  - Multi-tagging support (`#urgent`, `#project`, `#client`, etc.)
  - Category organization with custom color picker
- 🔍 **Filtering, Search & Sorting**:
  - Instant live search across task titles, descriptions, and tags
  - Segmented status tabs (*All*, *Pending*, *In Progress*, *Completed*)
  - Combinable filters (Priority + Category + Tags)
  - Sorting: Newest, Oldest, Due Date, Priority, Alphabetical
- 📊 **Productivity Views**:
  - **Dashboard**: Real-time calculated task completion stats, priority distribution, and category progress
  - **My Tasks**: Main tasks workspace with multi-filter toolbar
  - **Today View**: Dedicated focus on tasks due today and overdue tasks
  - **Upcoming View**: Grouped by Tomorrow, This Week, and Later
  - **Completed View**: Archive with 1-click restore or delete
  - **Categories & Tags**: Dedicated management views with live task counters
- 💾 **Zero-Backend Persistence**:
  - Auto-persists all tasks, categories, tags, profile info, and theme choices directly in browser `localStorage`.
- 📱 **Fully Responsive**:
  - Fluid mobile drawer with touch backdrop and 44px+ touch targets.

---

## 📁 Project Structure

```
todo list/
├── index.html               # Main SPA entry point and accessible modal dialogs
├── css/
│   └── style.css            # Design system, theme custom properties, responsive rules
├── js/
│   ├── api.js               # Client-side storage service (localStorage CRUD & stats engine)
│   ├── state.js             # Central reactive application state
│   ├── components/
│   │   ├── modal.js         # Accessible modal dialog controller
│   │   └── toast.js         # Toast notification component
│   ├── views/
│   │   ├── authView.js      # Sign-in & account views
│   │   ├── dashboardView.js # Overview metrics & progress charts
│   │   ├── tasksView.js     # Task lists, Today, Upcoming, and Completed views
│   │   ├── categoriesView.js# Category management view
│   │   ├── tagsView.js      # Tag management view
│   │   └── profileView.js   # User profile settings
│   └── app.js               # Main router and keyboard shortcut coordinator
├── vercel.json              # Vercel deployment configuration
└── README.md                # Project documentation
```

---

## 🛠️ Local Development

### Option 1: Open in Browser
Simply double-click `index.html` or open it with Live Server.

### Option 2: Run with Python HTTP Server
```powershell
python -m http.server 5000
```
Then visit `http://localhost:5000`.

### Option 3: Run with Node.js
```powershell
node server.js
```