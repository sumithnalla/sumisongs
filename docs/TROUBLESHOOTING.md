# Spotify Clone — Troubleshooting

## Common Issues

### Backend won't start

**Symptom:** `uvicorn` exits immediately

**Check:**
1. `.env` file exists and has all required variables
2. MongoDB URI is correct and Atlas cluster is running
3. Python virtual environment is activated
4. All dependencies installed: `pip install -r requirements.txt`

```bash
cd backend
.venv\Scripts\activate
python -c "from app.main import app; print('OK')"
```

---

### MongoDB connection failed

**Symptom:** `ServerSelectionTimeoutError` or similar

**Check:**
1. `MONGODB_URI` is correct in `.env`
2. Atlas cluster is running (not paused)
3. IP allowlist in Atlas allows your IP (or `0.0.0.0/0` for dev)
4. Network connectivity

```bash
python -c "import motor.motor_asyncio; print('Motor OK')"
```

---

### Authentication not working

**Symptom:** Login returns 401 even with correct credentials

**Check:**
1. User exists in MongoDB `users` collection
2. `is_active` is `true`
3. Password hash was created correctly (run `scripts/init_db.py`)
4. `JWT_SECRET` is set in environment

---

### Cookie not being sent

**Symptom:** Authenticated requests fail with 401

**Check:**
1. Frontend uses `withCredentials: true` in Axios
2. CORS `allow_credentials=True` is set in backend
3. Cookie `SameSite` is set to `Lax` (not `None` without `Secure`)
4. In development: backend must be on same hostname or CORS properly configured

---

### Audio not streaming

**Symptom:** Audio element shows error or won't play

**Check:**
1. R2 bucket `spotify-clone-media` exists and is accessible
2. R2 API token has read access to the bucket
3. Song exists in R2 at the expected key (`songs/<id>.mp3`)
4. Presigned URL is being generated correctly
5. R2 CORS allows the frontend origin

---

### Upload failing

**Symptom:** `POST /songs` returns error

**Check:**
1. File is valid MP3 (not just renamed)
2. File size is under 50MB
3. R2 credentials are correct
4. MongoDB is reachable for metadata storage
5. `python-multipart` is installed

---

### Frontend shows blank/white page

**Symptom:** CF Pages URL shows blank page

**Check:**
1. `pnpm build` succeeded with no errors
2. `index.html` is in `dist/` folder
3. Vite config has correct `base` URL
4. React Router configured for CF Pages (add `_redirects` file)

---

### Admin endpoints return 403

**Symptom:** Logged-in admin gets 403

**Check:**
1. User's `role` field in MongoDB is exactly `"admin"` (not `"Admin"`)
2. JWT token was issued after role was set
3. Re-login to get fresh JWT with correct role

---

## Checking Logs

### Backend (Render)
- Go to Render Dashboard → Web Service → Logs

### Frontend (Cloudflare Pages)
- Browser DevTools → Console + Network tabs

### MongoDB
- Atlas Dashboard → Cluster → Real-time Performance Panel

---

## Production Smoke Test

```bash
# 1. Test backend health
curl https://<render-url>.onrender.com/health

# 2. Test login
curl -X POST https://<render-url>.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"sumithnalla0607@gmail.com","password":"<password>"}' \
  -c cookies.txt

# 3. Test authenticated request
curl https://<render-url>.onrender.com/auth/me \
  -b cookies.txt

# 4. Test songs list
curl https://<render-url>.onrender.com/songs \
  -b cookies.txt
```
