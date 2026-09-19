# Spotify Clone — Security

## Security Measures

### Authentication
- JWT tokens in HTTP-only cookies (not accessible to JavaScript)
- `Secure` flag in production (HTTPS only)
- `SameSite=Lax` (CSRF protection)
- bcrypt password hashing (cost factor 12)
- Tokens expire after 7 days

### Authorization
- Role-based: `user` and `admin`
- Every admin endpoint independently verifies `role == admin` server-side
- Frontend role checks are UI-only — never the sole security gate
- Users can only modify their own data; admins can modify any

### Passwords
- Never stored in plaintext
- bcrypt with cost factor 12
- Never returned in API responses
- Never logged
- Only the hash is stored in MongoDB

### Credentials
- MongoDB URI: server-side environment variable only
- R2 API keys: server-side environment variable only
- JWT secret: server-side environment variable only
- Frontend environment only contains `VITE_API_URL` (no secrets)

### CORS
- Production: restricted to Cloudflare Pages domain only
- Development: `http://localhost:5173` allowed
- Credentials (cookies) enabled in CORS policy

### File Upload Security
- MIME type validated via magic bytes (not just extension)
- File size limit: 50MB for audio, 5MB for cover images
- Filename sanitized server-side
- Only MP3 audio files accepted for songs

### R2 Storage
- No public access to R2 bucket
- Audio served via short-lived presigned URLs (1 hour expiry)
- R2 credentials never sent to frontend

### Input Validation
- All inputs validated via Pydantic v2 schemas
- MongoDB query injection prevented by ObjectId parsing
- Pagination limits enforced server-side

### Rate Limiting
- Login endpoint: rate limited to prevent brute force
- Upload endpoint: rate limited per user

### HTTP Security Headers
- FastAPI configured to return appropriate security headers in production
- Cloudflare adds additional security headers at CDN layer

---

## Secret Management

All secrets are in `.env` files (not committed to Git):

```
backend/.env          ← Backend secrets
frontend/.env.local   ← Frontend config (no secrets)
```

`.gitignore` excludes all `.env` files.

---

## Changing Initial Passwords

After first deployment, change initial account passwords:
1. Login as the account
2. Use `PUT /users/me/password` endpoint
3. Or admin can reset via `PUT /admin/users/{id}/password`

---

## Known Security Trade-offs

| Trade-off | Reason |
|-----------|--------|
| M0 Atlas has no IP allowlist by default | Development convenience; configure for production |
| Presigned URLs valid for 1 hour | Balance between security and UX (seek, pause, resume) |
| No refresh token | Simplicity for v1; add for v2 if needed |
