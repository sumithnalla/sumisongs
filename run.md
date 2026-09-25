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

## 🚀 Deploying Changes Live to Production (Cloudflare Pages & Render)

Whenever you make any changes to the website or backend, use the commands below to publish them live:

### 1. Deploy Frontend Changes to Cloudflare Pages (Live in ~30 seconds)

```powershell
# Step 1: Open terminal in frontend directory
cd "d:\spotify clone\frontend"

# Step 2: Build the production bundle (TypeScript check + Vite compilation)
npm run build

# Step 3: Deploy the built 'dist' folder directly to Cloudflare Pages
npx wrangler pages deploy "dist" --project-name sumisongs --branch main --commit-dirty=true
```

> **What happens here:**
> - `npm run build` compiles all TypeScript, Tailwind CSS, images, and HTML into the optimized `frontend/dist` folder.
> - `npx wrangler pages deploy` instantly uploads the bundle to Cloudflare Pages edge servers.
> - The live website at **[https://sumisongs.pages.dev](https://sumisongs.pages.dev)** updates immediately!
> - The terminal will also provide a unique preview URL (e.g. `https://edb10602.sumisongs.pages.dev`) for testing.

---

### 2. Deploy Backend Changes to Render (Live in ~2-3 minutes)

The FastAPI backend on Render is connected directly to your GitHub repository `sumithnalla/sumisongs` on the `main` branch:

```powershell
# Step 1: Open terminal in root directory
cd "d:\spotify clone"

# Step 2: Stage all changed and new files
git add .

# Step 3: Commit with a descriptive message
git commit -m "feat: your change description here"

# Step 4: Push to GitHub main branch
git push origin main
```

> **What happens here:**
> - Render automatically detects new commits on `main`.
> - Render triggers a rolling build and deploys the new Python backend to **`https://sumisongs-api.onrender.com`** with zero downtime.

---

### 3. All-In-One Full Publish (Frontend + Backend + GitHub)

If you made changes to both frontend and backend and want everything synchronized:

```powershell
# 1. Build and publish frontend to Cloudflare Pages
cd "d:\spotify clone\frontend"
npm run build
npx wrangler pages deploy "dist" --project-name sumisongs --branch main --commit-dirty=true

# 2. Stage, commit, and push everything to GitHub
cd "d:\spotify clone"
git add .
git commit -m "feat: updated website and deployed to live hosting"
git push origin main
```

---

## 🌐 Production Links

- **Live Frontend (Cloudflare Pages):** [https://sumisongs.pages.dev](https://sumisongs.pages.dev)
- **Live Backend API (Render Web Service):** [https://sumisongs-api.onrender.com](https://sumisongs-api.onrender.com)
- **GitHub Repository:** [https://github.com/sumithnalla/sumisongs](https://github.com/sumithnalla/sumisongs)

