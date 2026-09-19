# Spotify-Style Music Streaming Web Application

## Master Engineering & Deployment Specification

---

# 1. PROJECT OBJECTIVE

Build a complete, production-ready Spotify-style music streaming web application.

The application should provide a polished, modern music-streaming experience similar in concept to Spotify, including:

* User authentication
* Admin authentication
* Admin user management
* Song uploading
* Song deletion
* Music playback
* Play / pause
* Previous / next
* Shuffle
* Repeat
* Queue
* Seek/progress control
* Volume control
* Playlists
* Liked songs
* Listening history
* Search
* Recently played
* Responsive UI
* Persistent user data
* Role-based permissions

The system must be designed as a real full-stack application rather than a frontend-only demonstration.

---

# 2. IMPORTANT DEVELOPMENT PRINCIPLE

The development agent is responsible for the **entire project lifecycle**.

Do not treat this as a task where only frontend code is generated.

The agent is responsible for:

1. Architecture
2. Technology/version selection
3. Local development environment
4. Frontend
5. Backend
6. Database
7. Database indexes
8. Authentication
9. Authorization
10. File storage
11. Cloud infrastructure
12. Environment variables
13. Testing
14. Debugging
15. Deployment
16. Production configuration
17. Monitoring/log inspection where available
18. Documentation
19. Troubleshooting
20. Future maintainability

If something can safely be configured through CLI/API/tooling, do that instead of asking the user to perform the operation manually.

Only ask the user for manual action when it genuinely requires their authentication, approval, billing decision, security confirmation, or another action that the agent cannot/should not perform.

---

# 3. FIRST TASK — ESTABLISH DEPLOYMENT ARCHITECTURE

DO NOT immediately start writing application code.

First investigate and establish the correct production architecture for:

* React + Vite frontend
* Python FastAPI backend
* MongoDB Atlas
* Cloudflare
* Cloudflare R2
* Authentication
* MP3 streaming
* Production deployment

Determine the currently supported and appropriate deployment architecture.

Do not force the Python backend into an incompatible Cloudflare runtime merely because Cloudflare is being used.

Cloudflare should be used wherever technically appropriate.

The final architecture must be documented in:

`docs/ARCHITECTURE.md`

The document must explain:

* Frontend hosting
* Backend hosting
* Database hosting
* Object/audio storage
* API communication
* Authentication flow
* Audio streaming flow
* Upload flow
* Deployment flow
* Environment variables
* Security boundaries

Before implementation, verify that the selected architecture actually supports the required application.

---

# 4. TECHNOLOGY STACK

Use the following technologies unless the architecture investigation identifies a technically necessary change.

## Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* Modern component architecture

The frontend should prioritize:

* clean UI
* responsive design
* good UX
* smooth animations where appropriate
* reusable components
* maintainable state management

Do not unnecessarily use Next.js unless there is a concrete architectural reason.

---

# 5. BACKEND

Use:

* Python
* FastAPI
* Pydantic
* Appropriate MongoDB Python driver
* Passlib/bcrypt or the currently recommended secure bcrypt-compatible implementation
* JWT authentication
* HTTP-only secure cookies

The backend must contain the actual security and authorization logic.

Never rely on the React frontend to enforce permissions.

---

# 6. DATABASE

Use:

**MongoDB Atlas**

MongoDB must be created/configured by the development agent using the appropriate MongoDB Atlas tooling/API/CLI where possible.

Do not require the user to manually create collections unless absolutely necessary.

The agent must create:

1. `users`
2. `songs`
3. `playlists`
4. `playlist_songs`
5. `likes`
6. `listening_history`

The agent must also configure appropriate indexes.

---

# 7. DATABASE COLLECTIONS

## 7.1 users

Purpose: store application users and administrators.

Fields:

* `_id`
* `username`
* `password_hash`
* `display_name`
* `role`
* `is_active`
* `created_at`
* `updated_at`
* `last_login`

Roles:

* `user`
* `admin`

Never store plaintext passwords.

Recommended indexes:

* unique username/email

---

## 7.2 songs

Purpose: store song metadata.

Fields:

* `_id`
* `title`
* `artist`
* `album`
* `genre`
* `duration`
* `audio_file_key`
* `cover_image_key`
* `uploaded_by`
* `created_at`
* `updated_at`
* `play_count`
* `is_public`

The actual MP3 binary should NOT normally be stored directly inside MongoDB.

---

## 7.3 playlists

Purpose: represent user playlists.

Fields:

* `_id`
* `name`
* `description`
* `owner_id`
* `cover_image_key`
* `is_public`
* `created_at`
* `updated_at`

Users should be able to create, rename and delete their playlists.

---

## 7.4 playlist_songs

Purpose: represent the relationship between playlists and songs.

Fields:

* `_id`
* `playlist_id`
* `song_id`
* `position`
* `added_at`

`position` is important for playlist ordering and playback.

---

## 7.5 likes

Purpose: store liked songs.

Fields:

* `_id`
* `user_id`
* `song_id`
* `created_at`

Create a unique constraint/index preventing the same user from liking the same song multiple times.

---

## 7.6 listening_history

Purpose: store listening history.

Fields:

* `_id`
* `user_id`
* `song_id`
* `played_at`
* `seconds_played`
* `completed`

This should support:

* Recently Played
* Listening History
* Most Played
* Future recommendation features

---

# 8. AUDIO STORAGE

Use **Cloudflare R2** for MP3 files.

Do NOT store large MP3 binaries directly in normal MongoDB documents.

Recommended conceptual structure:

`R2 bucket`

```text
songs/
    <song-id>.mp3

covers/
    <song-id>.jpg
```

MongoDB stores the metadata and R2 object key.

For example:

```text
audio_file_key:
songs/12345.mp3
```

The backend must control access appropriately.

The browser should be able to stream the audio efficiently.

Support HTTP range requests/streaming behavior where required so users can seek through songs rather than downloading the entire file before playback.

---

# 9. COVER IMAGES

Song/album/playlist cover images should also use appropriate object storage, preferably Cloudflare R2 unless the selected architecture determines another suitable approach.

MongoDB should store the object key/reference rather than unnecessarily storing large binary image data.

---

# 10. INITIAL ACCOUNTS

Create the following initial accounts during secure environment/database initialization.

## Initial normal user

Username:

`sumithnalla0607@gmail.com`

Initial password:

`SN06072006`

Role:

`user`

---

## Initial administrator

Username:

`sumithofficial2@gmail.com`

Initial password:

`sumith0FF_1104`

Role:

`admin`

---

# 11. CRITICAL CREDENTIAL SECURITY RULE

The credentials above are **bootstrap credentials**.

They must NEVER be:

* hardcoded into application source code
* committed to Git
* placed in frontend JavaScript
* included in public documentation
* printed in logs
* returned by API responses
* exposed to other users

Passwords must be bcrypt-hashed before being stored in MongoDB.

The plaintext passwords must only exist during the secure account initialization process.

If practical, implement a first-login password-change mechanism for the initial accounts.

The agent must clearly document how the initial credentials can be changed.

---

# 12. PASSWORD SECURITY

Passwords must never be stored in plaintext.

Example conceptual flow:

```text
User enters password
        ↓
Backend receives password over HTTPS
        ↓
bcrypt hashing/verification
        ↓
MongoDB stores password_hash
```

Login:

```text
Username + password
        ↓
Find user
        ↓
Retrieve password_hash
        ↓
bcrypt verification
        ↓
Correct?
   ↓          ↓
 YES          NO
 ↓             ↓
Create       Reject
session
```

Never implement reversible password encryption.

Never attempt to decrypt bcrypt hashes.

---

# 13. AUTHENTICATION

Implement secure authentication using:

* Username/email + password
* bcrypt password hashing
* JWT
* HTTP-only cookies
* Secure cookies in production
* Appropriate SameSite policy
* Token expiration
* Backend authentication middleware/dependency

The frontend should not store sensitive authentication tokens in localStorage unless there is a compelling documented reason.

Prefer HTTP-only cookies.

---

# 14. LOGIN FLOW

Expected behavior:

```text
User
 ↓
Login page
 ↓
Username/email
Password
 ↓
POST /auth/login
 ↓
FastAPI
 ↓
Find user
 ↓
bcrypt.verify()
 ↓
Create authenticated session/JWT
 ↓
HTTP-only cookie
 ↓
Frontend authenticated
```

Incorrect credentials must produce an appropriate authentication error.

Do not reveal whether the username or password specifically was wrong.

---

# 15. LOGOUT

Logout should:

* invalidate/remove the authentication cookie/session as appropriate
* clear frontend authentication state
* prevent access to protected resources

After logout, protected API requests must fail authentication.

---

# 16. ROLE-BASED AUTHORIZATION

There are two roles:

```text
user
admin
```

Backend authorization must be enforced server-side.

Admin-only operations include:

* create users
* delete users
* disable users
* view/manage users
* other administrative functionality

A normal user must receive an appropriate `403 Forbidden` response when attempting admin operations.

Do not rely on hiding buttons in React.

---

# 17. ADMIN USER MANAGEMENT

Admin dashboard must allow the administrator to:

### Create user

Input:

* username/email
* initial password
* display name

Backend:

1. Validate input
2. Check uniqueness
3. Hash password
4. Create MongoDB user document
5. Return safe user information

Never return the password hash.

### Delete user

Admin can delete/deactivate users.

Before permanently deleting related data, implement sensible relationship handling.

Consider whether user-owned playlists/history should be deleted, anonymized, or retained based on the application's data policy.

### Disable user

Prefer supporting account deactivation through:

`is_active = false`

A disabled user cannot log in.

---

# 18. USER FUNCTIONALITY

Normal users should be able to:

* Login
* Logout
* Browse songs
* Search songs
* Play songs
* Pause songs
* Resume songs
* Seek
* Change volume
* Play next
* Play previous
* Shuffle
* Repeat
* Create playlists
* Rename playlists
* Delete playlists
* Add songs to playlists
* Remove songs from playlists
* Like songs
* Unlike songs
* View liked songs
* View listening history
* View recently played songs
* Upload songs if the application's permission model allows user uploads
* Delete songs they are authorized to delete

---

# 19. SONG UPLOAD SYSTEM

Implement MP3 upload.

Flow:

```text
User
 ↓
Select MP3
 ↓
Frontend
 ↓
Backend validation
 ↓
Upload to R2
 ↓
Receive/store object key
 ↓
Create MongoDB song metadata
```

Validate:

* file type
* file size
* filename
* upload authorization

Do not blindly trust the file extension.

The backend must validate the uploaded file appropriately.

Extract song metadata/duration where practical.

---

# 20. SONG DELETE SYSTEM

Deleting a song must not merely delete the MongoDB record.

The system should:

1. Authenticate requester
2. Authorize requester
3. Delete audio object from R2
4. Delete/handle cover image appropriately
5. Delete MongoDB song metadata
6. Clean up playlist relationships
7. Clean up likes as appropriate
8. Preserve or appropriately handle listening history

Do not leave orphaned MP3 files in R2.

---

# 21. MUSIC PLAYER

Build a persistent global music player.

It should remain available while navigating through the application.

The player should support:

* Play
* Pause
* Resume
* Previous
* Next
* Progress bar
* Seeking
* Duration
* Current time
* Volume
* Mute
* Shuffle
* Repeat
* Queue
* Automatic next song
* Error handling
* Loading state

Use the browser's native audio capabilities underneath the custom UI.

---

# 22. NEXT/PREVIOUS

The frontend should maintain an appropriate playback queue.

Example:

```text
Song A
Song B
Song C
Song D
Song E
```

Current:

```text
Song C
```

Next:

```text
Song D
```

Previous:

```text
Song B
```

Do not unnecessarily query MongoDB for every next/previous button click.

Fetch/construct the queue appropriately and manage playback state on the frontend.

---

# 23. SHUFFLE

Implement proper shuffle behavior.

Requirements:

* Randomized playback order
* Avoid immediately replaying the current song
* Maintain queue state
* Preserve sensible previous/next behavior
* Toggling shuffle should not unexpectedly restart the current song

---

# 24. REPEAT

Support:

### Repeat Off

```text
A → B → C → End
```

### Repeat All

```text
A → B → C → A → B → C
```

### Repeat One

```text
A → A → A → A
```

---

# 25. PLAYLISTS

Users can:

* Create playlist
* Rename playlist
* Delete playlist
* Add song
* Remove song
* Reorder songs
* Play playlist
* Shuffle playlist

Playlist ordering should use the `position` field in `playlist_songs`.

---

# 26. LIKED SONGS

Users can:

* Like song
* Unlike song
* View liked songs
* Play liked songs
* Shuffle liked songs

Do not create duplicate likes.

---

# 27. LISTENING HISTORY

Record appropriate listening activity.

Track:

* user
* song
* timestamp
* seconds played
* completion

Do not create an excessive number of database writes every few seconds.

Design history/progress recording efficiently.

---

# 28. SEARCH

Implement search for:

* Song title
* Artist
* Album
* Genre

The search should be fast and user-friendly.

Use appropriate MongoDB indexes/search functionality rather than repeatedly loading the entire song collection into the frontend.

---

# 29. UI/UX

The application should feel like a polished modern music streaming service.

Requirements:

* Dark music-focused interface
* Desktop-first but responsive
* Mobile-friendly
* Sidebar/navigation
* Main content area
* Persistent bottom player
* Album artwork
* Song cards
* Playlist cards
* Search interface
* User menu
* Admin dashboard
* Loading states
* Empty states
* Error states
* Toast/notification system where appropriate
* Smooth transitions
* Accessible controls

Do not blindly copy Spotify's proprietary branding/assets.

Create an original Spotify-inspired music application design.

---

# 30. RESPONSIVE DESIGN

Support:

* Desktop
* Laptop
* Tablet
* Mobile

The player must remain usable on small screens.

Navigation should adapt appropriately.

---

# 31. FRONTEND ARCHITECTURE

Keep the React application modular.

Separate:

* pages
* components
* layouts
* API client
* authentication
* player state
* playlist state
* reusable UI
* types
* utilities

Do not put the entire application inside a few enormous React files.

---

# 32. BACKEND ARCHITECTURE

Use a clean FastAPI structure.

Separate:

* routes
* authentication
* authorization
* database access
* models/schemas
* services
* R2/storage functionality
* configuration
* utilities

Avoid putting all backend logic into a single Python file.

---

# 33. API DESIGN

Use sensible REST-style endpoints.

Examples conceptually:

```text
/auth/login
/auth/logout
/auth/me

/users/...

/admin/users/...

/songs
/songs/{id}

/playlists
/playlists/{id}

/likes
/history
```

Exact endpoint structure may be improved by the agent during implementation.

Document the final API.

---

# 34. ENVIRONMENT VARIABLES

All secrets and deployment-specific configuration must be environment variables.

Examples:

```text
MONGODB_URI
MONGODB_DATABASE
JWT_SECRET
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```

Do not commit real values.

Create:

`.env.example`

containing variable names but no secrets.

Create/update:

`.gitignore`

to ensure `.env` and secret files are excluded.

---

# 35. VERSION MANAGEMENT

Before installing dependencies:

1. Determine compatible stable versions.
2. Verify compatibility between major dependencies.
3. Install them.
4. Pin/document versions.
5. Record the development environment.

Document versions in:

`docs/ENVIRONMENT.md`

At minimum record:

* Node.js
* npm/pnpm
* React
* Vite
* TypeScript
* Tailwind
* Python
* FastAPI
* Pydantic
* MongoDB driver
* bcrypt/passlib implementation
* Cloudflare/Wrangler tooling
* any other critical dependency

Do not arbitrarily use outdated versions merely because they are familiar.

Do not automatically upgrade dependencies later without checking compatibility.

---

# 36. REPRODUCIBLE PROJECT

The project must be reproducible on another machine.

Someone cloning the repository should be able to:

1. Install documented runtime versions
2. Install dependencies
3. Configure `.env`
4. Run development environment
5. Run tests
6. Build production version

Document the process in:

`README.md`

---

# 37. GIT

Initialize a Git repository if necessary.

Create an appropriate `.gitignore`.

Never commit:

* `.env`
* passwords
* API keys
* private keys
* database credentials
* R2 secrets
* JWT secrets
* generated sensitive files

Use meaningful commits during development.

---

# 38. CLOUDFLARE

Use Cloudflare for appropriate infrastructure.

Investigate and configure:

* Frontend hosting
* R2
* DNS
* SSL/TLS
* deployment
* environment variables
* required Cloudflare configuration

Use Wrangler/Cloudflare tooling where appropriate.

The agent should perform CLI configuration wherever possible.

---

# 39. MONGODB ATLAS

The agent should establish:

* Atlas project
* database
* collections
* indexes
* required database configuration
* connection configuration

Use least-privilege credentials where possible.

Do not expose MongoDB credentials to the frontend.

The React application must NEVER connect directly to MongoDB.

Architecture:

```text
React
  ↓
FastAPI
  ↓
MongoDB Atlas
```

---

# 40. R2 SECURITY

The frontend must not receive unrestricted R2 administrative credentials.

R2 access credentials belong on the server/backend side.

The backend controls upload/delete operations.

Where appropriate, use signed URLs or controlled access mechanisms for media.

---

# 41. SECURITY REQUIREMENTS

Implement at minimum:

* HTTPS in production
* bcrypt password hashing
* HTTP-only authentication cookies
* secure cookies in production
* authentication middleware
* role-based authorization
* input validation
* file validation
* upload size limits
* rate limiting where appropriate
* CORS configuration
* secure headers where appropriate
* secret management
* MongoDB credentials kept server-side
* R2 credentials kept server-side
* no sensitive information in logs
* no passwords in API responses

---

# 42. ADMIN SECURITY

Never determine admin privileges based solely on frontend state.

This is NOT sufficient:

```text
if user.role === "admin"
```

inside React.

The backend must independently verify:

```text
authenticated user
+
role == admin
```

before every administrative operation.

---

# 43. ERROR HANDLING

Implement proper error handling.

Frontend should show useful messages without exposing internal details.

Backend should:

* log useful diagnostic information
* avoid leaking secrets
* return appropriate HTTP status codes
* handle database failures
* handle storage failures
* handle authentication failures
* handle invalid uploads
* handle unavailable songs

---

# 44. TESTING RESPONSIBILITY

Testing is a mandatory part of implementation.

Do not consider the project complete simply because it builds.

The agent must create and run automated tests where practical.

Test:

## Authentication

* correct credentials
* incorrect password
* nonexistent user
* logout
* expired authentication
* disabled account
* invalid session

## Authorization

* normal user accessing normal functionality
* normal user attempting admin API
* admin accessing admin API
* unauthorized song deletion
* unauthorized playlist modification

## Database

* user creation
* duplicate username prevention
* song creation
* playlist creation
* likes
* history
* relationships

## Upload

* valid MP3
* invalid file
* oversized file
* upload failure
* R2 failure

## Playback

* play
* pause
* resume
* next
* previous
* shuffle
* repeat
* seeking
* queue behavior

## Playlists

* create
* rename
* delete
* add song
* remove song
* reorder

## Deployment

After deployment, run production smoke tests.

---

# 45. BUILD CHECK

Before considering implementation complete:

Frontend must:

* install successfully
* build successfully
* have no critical TypeScript errors
* have no critical console errors
* have working routing
* have working authentication

Backend must:

* start successfully
* connect to MongoDB
* authenticate users
* authorize users
* communicate with R2
* pass backend tests

---

# 46. PRODUCTION SMOKE TEST

After deployment, verify:

```text
Landing page
        ↓
Login
        ↓
Authenticated dashboard
        ↓
Song browsing
        ↓
Song playback
        ↓
Next/previous
        ↓
Shuffle/repeat
        ↓
Playlist
        ↓
Like
        ↓
History
        ↓
Logout
```

Then test admin:

```text
Admin login
        ↓
Admin dashboard
        ↓
Create user
        ↓
New user login
        ↓
Disable/delete user
        ↓
Verify access behavior
```

---

# 47. TROUBLESHOOTING RESPONSIBILITY

If something breaks, the development agent should investigate before asking the user to perform manual debugging.

Check:

1. Frontend errors
2. Backend errors
3. Network requests
4. API responses
5. Authentication cookies
6. JWT/session handling
7. MongoDB connection
8. MongoDB data/indexes
9. R2 configuration
10. Cloudflare configuration
11. Environment variables
12. Deployment logs
13. Browser console
14. Build output

Reproduce the issue where possible.

Fix the root cause rather than applying superficial workarounds.

---

# 48. DOCUMENTATION

Create and maintain:

```text
README.md

docs/
├── ARCHITECTURE.md
├── DATABASE.md
├── API.md
├── AUTHENTICATION.md
├── DEPLOYMENT.md
├── ENVIRONMENT.md
├── SECURITY.md
└── TROUBLESHOOTING.md
```

Documentation must reflect the actual implementation.

Do not document imaginary functionality.

---

# 49. DATABASE DOCUMENTATION

`docs/DATABASE.md` must explain:

* collections
* fields
* relationships
* indexes
* ownership
* deletion behavior
* authentication data
* song metadata
* R2 references

Include a conceptual relationship diagram.

---

# 50. DEPLOYMENT DOCUMENTATION

`docs/DEPLOYMENT.md` must explain:

* how frontend is deployed
* how backend is deployed
* how MongoDB Atlas is configured
* how R2 is configured
* required environment variables
* domain configuration
* production deployment procedure
* rollback procedure where applicable

Do not expose actual secrets.

---

# 51. DEVELOPMENT RULE

Do not ask the user to make technical decisions that can reasonably be determined by investigation.

For example, do not ask:

> "Should we use React 18 or React 19?"

Instead:

1. Check current stable ecosystem compatibility.
2. Select the appropriate version.
3. Document the choice.
4. Proceed.

Similarly, do not ask the user to manually create every MongoDB collection or Cloudflare resource if the authenticated CLI/API can safely create them.

---

# 52. WHEN USER ACTION IS REQUIRED

Ask the user only when necessary.

Examples:

* Cloudflare authentication requires browser confirmation
* MongoDB Atlas authentication/API credentials need to be supplied
* Billing/paid resource creation requires confirmation
* Domain ownership/DNS requires user authorization
* A destructive production operation requires confirmation
* A security-sensitive action requires explicit approval

When asking for user action, give exact instructions.

Example:

```text
Run this command:
<command>

Then complete the browser login.

Tell me when authentication is complete.
```

Do not make the user troubleshoot vague errors.

---

# 53. DO NOT DESTROY PRODUCTION DATA

Before destructive operations:

* identify whether the target is development or production
* warn before destructive changes
* back up important data where appropriate
* avoid dropping databases/collections casually
* avoid deleting R2 objects without confirming relationships

Never run a destructive production database operation merely to solve a development problem.

---

# 54. PERFORMANCE

Design the application so it can scale beyond a toy demonstration.

Avoid:

* downloading all songs at once
* loading entire collections unnecessarily
* writing listening progress every second
* excessive database queries
* huge frontend state objects
* unnecessary re-renders
* storing large audio files in MongoDB

Use:

* pagination
* indexes
* efficient queries
* appropriate caching
* streaming
* efficient state management

---

# 55. IMPORTANT AUDIO REQUIREMENT

The application is a streaming music application.

The browser should stream MP3 content efficiently.

Users should be able to:

* start playback
* pause
* resume
* seek forward
* seek backward
* change songs
* continue playback while navigating through the application

Ensure the chosen storage/backend architecture supports this correctly.

---

# 56. FINAL ACCEPTANCE CRITERIA

The project is considered complete only when:

### Infrastructure

* [ ] Deployment architecture established
* [ ] Cloudflare configured
* [ ] R2 configured
* [ ] MongoDB Atlas configured
* [ ] Production environment variables configured
* [ ] Frontend deployed
* [ ] Backend deployed

### Database

* [ ] All six collections created
* [ ] Indexes created
* [ ] Initial admin created
* [ ] Initial user created
* [ ] Passwords bcrypt hashed

### Authentication

* [ ] Login works
* [ ] Logout works
* [ ] Authentication persists correctly
* [ ] Invalid credentials rejected
* [ ] Disabled users rejected
* [ ] Admin permissions enforced server-side

### Music

* [ ] Upload works
* [ ] MP3 stored in R2
* [ ] Metadata stored in MongoDB
* [ ] Playback works
* [ ] Seeking works
* [ ] Next works
* [ ] Previous works
* [ ] Shuffle works
* [ ] Repeat works
* [ ] Queue works

### User features

* [ ] Playlists work
* [ ] Likes work
* [ ] Listening history works
* [ ] Search works
* [ ] Recently played works

### Admin

* [ ] Admin login
* [ ] Create user
* [ ] Disable user
* [ ] Delete user
* [ ] User permission enforcement

### Quality

* [ ] Automated tests pass
* [ ] Production build passes
* [ ] No critical console errors
* [ ] No critical backend errors
* [ ] Production smoke test passes
* [ ] Documentation complete

---

# 57. FINAL OPERATING INSTRUCTION TO THE DEVELOPMENT AGENT

You are not only a code generator.

You are responsible for delivering and maintaining the complete working system.

Before implementation:

1. Inspect the available development environment.
2. Determine compatible dependency versions.
3. Establish the production architecture.
4. Document the architecture.
5. Authenticate with required services when user authorization is required.
6. Create/configure infrastructure through CLI/API where possible.
7. Create MongoDB Atlas database and collections.
8. Configure R2.
9. Build the backend.
10. Build the frontend.
11. Implement authentication and authorization.
12. Implement music storage and streaming.
13. Implement all requested user/admin functionality.
14. Write tests.
15. Run tests.
16. Fix failures.
17. Build production artifacts.
18. Deploy.
19. Perform production smoke tests.
20. Fix any deployment/runtime problems discovered.
21. Update documentation to match the final system.

When something fails:

**Investigate → reproduce → identify root cause → fix → test → verify.**

Do not simply tell the user what went wrong.

Do not ask the user to manually perform a technical task that you can safely perform yourself through the available tools.

The user's role should primarily be to provide required authentication/authorization when necessary and make business/product decisions.

The development agent owns the technical implementation.

---

# 58. STARTING POINT

Do not begin by writing application features.

Begin with:

**PHASE 1 — ENVIRONMENT & ARCHITECTURE AUDIT**

Determine:

* available Node version
* available package manager
* available Python version
* available Python package manager
* available Git installation
* Cloudflare/Wrangler availability
* MongoDB/Atlas tooling availability
* authentication status for Cloudflare
* authentication/access status for MongoDB Atlas
* available deployment options
* current compatibility of React/Vite/FastAPI/Cloudflare/MongoDB/R2

Then produce:

`docs/ARCHITECTURE.md`

and

`docs/ENVIRONMENT.md`

before proceeding with the application implementation.

Do not proceed with an incompatible deployment architecture merely to start coding quickly.

The final objective is a **fully working, reproducible, tested and deployable Spotify-style music streaming application**, not merely a visual clone.
