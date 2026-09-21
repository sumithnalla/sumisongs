# Spotify Clone — Local Development Guide (`run.md`)

This guide provides step-by-step instructions and terminal commands to run both the **Backend** and **Frontend** on your local machine (`localhost`).

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher) & **npm**
- **Python** (v3.10, v3.11, or v3.12)
- **Git** (optional, for version control)

---

## 🚀 Option 1: Full Local Stack (Backend + Frontend)

Follow these steps to run both the FastAPI backend and Vite frontend locally.

### Step 1: Start the Backend (Port 8000)

Open a terminal (PowerShell or Command Prompt):

```powershell
# 1. Navigate to the backend directory
cd "d:\spotify clone\backend"

# 2. Activate existing Python virtual environment
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# (Or on Windows CMD: .\.venv\Scripts\activate.bat)

# If virtual environment doesn't exist, create it:
# python -m venv .venv
# .\.venv\Scripts\Activate.ps1
# pip install -r requirements.txt

# 3. Start the FastAPI server with hot-reload
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

> **Backend Health Verification:**
> Open your browser or a new tab to [http://localhost:8000/health](http://localhost:8000/health) or [http://localhost:8000/docs](http://localhost:8000/docs) (Interactive Swagger API documentation).

---

### Step 2: Start the Frontend (Port 5173)

Open a **second** terminal window:

```powershell
# 1. Navigate to the frontend directory
cd "d:\spotify clone\frontend"

# 2. Install dependencies (if not already installed)
npm install

# 3. Start Vite development server
npm run dev
```

The terminal will display:
```
  VITE v8.3.0  ready in ~200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Step 3: Open the Website

Open your browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## ⚡ Option 2: Frontend-Only (Connects to Live Render Cloud API)

If you only want to work on the UI, test mobile view, or test Dark/Light mode without running Python locally:

1. In `frontend/vite.config.ts`, change `target: 'http://localhost:8000'` to `target: 'https://sumisongs-api.onrender.com'`:
```ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'https://sumisongs-api.onrender.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```
2. Run:
```powershell
cd "d:\spotify clone\frontend"
npm run dev
```
3. Open **[http://localhost:5173](http://localhost:5173)**.

---

## 🔑 Demo Login Credentials

The login page features one-click quick fill buttons, or you can enter these credentials manually:

| Account Type | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Standard User** | `sumithnalla0607@gmail.com` | `SN06072006` | Browse, Search, Play, Like, History, Create Playlists |
| **Admin User** | `sumithofficial2@gmail.com` | `SN06072006` | All standard features + Upload Songs & Admin Dashboard |

---

## 🌓 Testing Dark Mode & Light Mode

The website supports high-contrast, polished Dark and Light themes with persistent state stored in `localStorage`:
- **Desktop:** Click the **Sun / Moon** icon located at the top-right of the navigation bar.
- **Mobile:** Open the mobile menu drawer (tap the 3-dots icon on the bottom navigation bar) and toggle the **Dark / Light Mode** pill switch.
- **Login Screen:** A theme toggle is also present at the top-right of the login screen.

---

## 📱 Testing Mobile Optimization Locally

To preview and test the mobile experience on your desktop browser:

1. Open **[http://localhost:5173](http://localhost:5173)** in Google Chrome, Edge, or Brave.
2. Press **`F12`** (or right-click anywhere and select **Inspect**).
3. Press **`Ctrl + Shift + M`** (or click the **Toggle device toolbar** icon at the top of Developer Tools).
4. Select a device preset (e.g., **iPhone 14 Pro**, **Pixel 7**, or set width to `390px` or `412px`).
5. **Key Mobile Features to Test:**
   - **Bottom Navigation Bar:** Fast switching between *Home*, *Search*, *Library*, *Liked*, and *Menu*.
   - **Slide-Over Drawer:** Tap the *Menu* (3-dots) tab to open the side drawer with profile details, Dark/Light mode toggle, Playlists, Upload, and Logout.
   - **Floating Mini Player:** Starts docked above the bottom bar with song details and quick play/pause/next.
   - **Full-Screen Now Playing View:** Tap anywhere on the mini player card to expand the full-screen player view with artwork, seek scrubber, shuffle, repeat, and volume controls. Tap the down arrow `v` to collapse.
   - **Responsive Grids:** Albums, songs, and search categories automatically wrap gracefully into 2-column or 1-column layouts without any horizontal overflow.

---

## 🌐 Production Links

- **Live Frontend (Cloudflare Pages):** [https://sumisongs.pages.dev](https://sumisongs.pages.dev)
- **Live Backend API (Render Web Service):** [https://sumisongs-api.onrender.com](https://sumisongs-api.onrender.com)
- **GitHub Repository:** [https://github.com/sumithnalla/sumisongs](https://github.com/sumithnalla/sumisongs)

---

## 🛠️ Rebuilding & Deploying Updates

When you make changes to the frontend and want to publish them live:

```powershell
# Build the production bundle
cd "d:\spotify clone\frontend"
npm run build

# Deploy directly to Cloudflare Pages
npx wrangler pages deploy "dist" --project-name sumisongs --branch main --commit-dirty=true
```
