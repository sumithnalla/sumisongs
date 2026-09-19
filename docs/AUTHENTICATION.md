# Spotify Clone — Authentication

## Overview

Authentication uses **JWT tokens stored in HTTP-only cookies**. The frontend never directly accesses the token — it is sent automatically by the browser on every request.

---

## Login Flow

```
POST /auth/login
  Body: { username: "...", password: "..." }

FastAPI:
  1. Find user by username in MongoDB
  2. Check is_active == true (reject disabled accounts)
  3. bcrypt.verify(plain_password, user.password_hash)
  4. If valid: create JWT payload { sub: user_id, role: user.role, username }
  5. Sign JWT with JWT_SECRET (HS256, expires in JWT_EXPIRE_DAYS days)
  6. Set cookie:
       Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800

Response: 200 OK + user info (no password hash)
Failure: 401 Unauthorized ("Invalid credentials")
```

---

## Cookie Configuration

| Attribute | Development | Production |
|-----------|-------------|------------|
| `HttpOnly` | ✅ | ✅ |
| `Secure` | ❌ (HTTP localhost) | ✅ (HTTPS only) |
| `SameSite` | `Lax` | `Lax` |
| `Path` | `/` | `/` |
| `Max-Age` | 604800 (7 days) | 604800 (7 days) |

---

## Logout Flow

```
POST /auth/logout

FastAPI:
  1. Clear the cookie by setting Max-Age=0
  2. Return 200 OK

Browser: cookie removed, subsequent requests unauthenticated
```

---

## Protected Route Pattern

Every protected FastAPI endpoint uses a dependency:

```python
async def get_current_user(token: str = Cookie(alias="access_token")):
    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user or not user["is_active"]:
        raise HTTPException(401)
    return user
```

---

## Admin Route Pattern

Admin endpoints add an additional role check:

```python
async def require_admin(current_user = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Forbidden")
    return current_user
```

---

## Security Notes

- Invalid credentials always return `401` with the message `"Invalid credentials"` — never specify whether username or password was wrong
- Disabled users (`is_active: false`) are rejected at login and on every request
- Expired JWTs are rejected by the JWT decoder
- The JWT payload contains `user_id`, `username`, and `role` — role is re-verified from DB on admin endpoints
- Passwords are never logged, returned in API responses, or stored in plaintext
