# Spotify Clone — Deployment

## Architecture Summary

- **Frontend:** Cloudflare Pages
- **Backend:** Render.com (Docker)
- **Database:** MongoDB Atlas
- **Storage:** Cloudflare R2

---

## Backend Deployment (Render.com)

### First-time Setup

1. Go to [dashboard.render.com](https://dashboard.render.com) and create a new **Web Service**
2. Connect to the GitHub repository
3. Select **Docker** as runtime
4. Root directory: `backend/`
5. Set environment variables (see below)
6. Click **Create Web Service**

Alternatively, `render.yaml` in the repo root defines the service and can be used for Infrastructure-as-Code deployment.

### Environment Variables (Render)

Set these in the Render dashboard under **Environment**:

```
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=spotify_clone
JWT_SECRET=<64-char random hex>
JWT_EXPIRE_DAYS=7
R2_ACCOUNT_ID=872fff74d9adfedf4fd7e5d0a62a8778
R2_ACCESS_KEY_ID=<r2 api token key>
R2_SECRET_ACCESS_KEY=<r2 api token secret>
R2_BUCKET_NAME=spotify-clone-media
R2_ENDPOINT_URL=https://872fff74d9adfedf4fd7e5d0a62a8778.r2.cloudflarestorage.com
ALLOWED_ORIGINS=https://<your-cf-pages-url>.pages.dev
ENVIRONMENT=production
```

### Re-deploying

Push to `main` branch → Render auto-deploys.

Or manually trigger via Render dashboard.

---

## Frontend Deployment (Cloudflare Pages)

### Build and Deploy

```bash
cd frontend
pnpm install
pnpm build
npx wrangler pages deploy dist --project-name spotify-clone
```

### First-time Setup

The first `wrangler pages deploy` creates the Pages project automatically.

### Environment Variables (CF Pages)

Set in Cloudflare Dashboard → Pages → Project → Settings → Environment Variables:

**Production:**
```
VITE_API_URL=https://<render-service>.onrender.com
```

**Preview:**
```
VITE_API_URL=http://localhost:8000
```

> Note: Vite bakes env vars at build time. Rebuild and redeploy after changing them.

---

## MongoDB Atlas Configuration

### Connection

The Atlas M0 cluster connection string format:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/spotify_clone?retryWrites=true&w=majority
```

### IP Allowlist

For production, configure Atlas IP allowlist:
- Add Render.com static IPs (check Render docs for current list)
- Or set `0.0.0.0/0` for development (restrict before production launch)

### Database Initialization

Run once after setting up the connection string:
```bash
cd scripts
python init_db.py
```

This creates collections, indexes, and seed accounts.

---

## Cloudflare R2 Configuration

### Create R2 API Token

1. Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create token with:
   - Permissions: Object Read & Write
   - Bucket: `spotify-clone-media`
3. Note the **Access Key ID** and **Secret Access Key**

### R2 CORS (for audio streaming)

The backend generates presigned URLs. Browsers will access R2 directly for audio.
Configure CORS on the bucket:

```json
[
  {
    "AllowedOrigins": ["https://<your-pages-url>.pages.dev"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Type", "Accept-Ranges", "Content-Range"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Production Deployment Procedure

1. Ensure all environment variables are set on Render and CF Pages
2. Run `scripts/init_db.py` (once only, on first deployment)
3. Push backend code → Render deploys automatically
4. Run `cd frontend && pnpm build && npx wrangler pages deploy dist`
5. Verify deployment with smoke tests (see `docs/TROUBLESHOOTING.md`)

---

## Rollback

### Backend
- Render keeps deploy history; use **Rollback** button in dashboard

### Frontend
- Cloudflare Pages keeps deployment history; use **Rollback** in Pages dashboard

---

## Domain Configuration (Optional)

1. In CF Pages → Custom Domains → Add custom domain
2. Add the domain DNS record (Cloudflare manages this automatically if domain is on CF)
3. Update `ALLOWED_ORIGINS` on Render backend
4. Redeploy backend with new CORS config
