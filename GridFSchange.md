We need to change the ACTIVE file-storage implementation, but NOT remove or redesign the existing R2 storage architecture.

CURRENT REQUIREMENT:
This Spotify clone is for personal use by only me. The current total music library is approximately 49.6 MB, and even after adding around 30 more songs it should remain below approximately 300 MB.

I want MongoDB GridFS to be the ACTIVE storage backend for audio files and cover images for now.

IMPORTANT:
DO NOT remove Cloudflare R2 from the project.
DO NOT delete the existing R2 service, configuration, abstraction, environment variables, documentation, or architecture.
DO NOT remove the R2 integration that has already been implemented.
Keep R2 available as a future/alternative storage provider so that we can switch from MongoDB GridFS to Cloudflare R2 later with minimal code changes.

The goal is:

Storage abstraction/interface
        ↓
Active provider = MongoDB GridFS
        ↓
MongoDB Atlas

Future alternative:
Storage provider = Cloudflare R2
        ↓
Cloudflare R2

IMPLEMENTATION REQUIREMENTS:

1. Inspect the existing project before changing anything.
   - Read the current storage implementation.
   - Read `services/r2.py`.
   - Read the existing song upload, stream, delete, and cover-image logic.
   - Read the environment/configuration files.
   - Understand the current local-file fallback.
   - Do not blindly rewrite working code.

2. Introduce a proper storage abstraction/provider layer.

   The application should not directly depend on R2 or GridFS inside the song routes.

   Create a storage interface/service with operations conceptually equivalent to:

   - upload audio file
   - upload cover image
   - get/stream audio
   - get cover image
   - delete audio
   - delete cover image
   - check whether an object exists

   The exact implementation should follow the existing project structure and coding conventions.

3. Implement MongoDB GridFS as a storage provider.

   MongoDB GridFS should become the ACTIVE provider.

   Store:
   - MP3/audio files in GridFS
   - cover images in GridFS

   Keep the existing MongoDB song metadata collection exactly as the metadata layer.

   Do not put the entire song metadata structure into GridFS.

4. IMPORTANT DATABASE DESIGN:

   Keep the existing `songs` collection and its metadata fields.

   The song document should reference the GridFS file appropriately, for example through a GridFS file ID/object identifier or another clean provider-neutral storage reference.

   Do not hard-code the application to a GridFS-specific identifier if doing so would make a future R2 migration unnecessarily difficult.

   Design the storage reference so the provider can later be changed to R2.

5. Preserve the existing R2 implementation.

   The existing `services/r2.py` must remain available.

   If necessary, refactor it into an R2 storage provider implementing the same storage abstraction.

   Do not delete it merely because GridFS is now active.

6. Add a MongoDB GridFS provider.

   Use the existing MongoDB connection.

   Do not create a second database connection unnecessarily.

   Use the async MongoDB stack already used by this project where appropriate.

7. Make the active storage provider configurable.

   Add an environment/configuration setting such as:

   STORAGE_PROVIDER=gridfs

   The application should use GridFS when this is selected.

   Keep support for something equivalent to:

   STORAGE_PROVIDER=r2

   for future switching.

   If the existing project already has a provider-selection mechanism, extend it instead of creating a duplicate mechanism.

8. Keep the local development fallback if it is already useful.

   Do not break the existing local fallback.

   The final storage selection should be conceptually:

   configured provider
        ↓
   GridFS / R2
        ↓
   existing local fallback only where appropriate

   Do not allow a silent fallback that could hide production storage failures.

9. AUDIO STREAMING IS CRITICAL.

   The existing application supports audio playback, seeking and progress controls.

   MongoDB GridFS must be integrated in a way that supports efficient audio delivery and HTTP Range/partial-content behavior required by the browser.

   Do NOT simply read the entire MP3 into memory and return it as one huge response.

   Implement proper streaming/range handling compatible with the existing frontend audio player.

   Verify:
   - play
   - pause
   - seek forward
   - seek backward
   - progress updates
   - reload and play again
   - next/previous
   - queue playback

10. COVER IMAGES:

   Store uploaded cover images in GridFS.

   Update the existing cover-image retrieval logic so the frontend can display them correctly.

11. UPLOAD FLOW:

   The existing Upload page must continue working.

   The flow should remain:

   Select MP3
   + select cover image
   + enter metadata
   → backend
   → GridFS
   → MongoDB song metadata
   → song immediately available in library/player

   I must NOT have to manually insert files into MongoDB.

12. DELETE FLOW:

   When a song is deleted:
   - delete its MongoDB metadata
   - delete its GridFS audio file
   - delete its GridFS cover image
   - clean up any related references according to the existing application behavior

   Make sure there are no orphaned GridFS files.

13. EXISTING 12 SAMPLE SONGS:

   Inspect the current seeded sample songs and determine whether they currently depend on the local-file fallback.

   Migrate/reseed them into GridFS as appropriate.

   Do not duplicate files unnecessarily.

   After migration, all existing sample songs must play through GridFS.

14. EXISTING R2 BUCKET:

   R2 is currently blocked/not enabled.

   DO NOT ask me to enable R2 right now.

   DO NOT remove the planned R2 bucket or R2 architecture.

   Do not make any unnecessary Cloudflare changes.

   GridFS is now the active storage provider for this project.

15. DATABASE STORAGE LIMIT:

   This is a personal single-user application.

   Current music library is approximately 49.6 MB.

   Expected library after adding approximately 30 more songs should remain below approximately 300 MB.

   Verify the actual current MongoDB storage usage before making assumptions.

   Add a clear documented warning/health check for approaching the Atlas storage limit.

   Do not artificially impose a tiny application-level file limit if the existing requirements don't require it.

16. SECURITY:

   GridFS files must only be accessible through the application's authorized API/storage layer according to the existing application's authorization rules.

   Do not expose unrestricted database credentials or GridFS access to the frontend.

   Keep MongoDB credentials server-side.

17. TESTING:

   Add/update automated tests for:

   - GridFS upload
   - GridFS retrieval
   - GridFS deletion
   - song metadata creation
   - song deletion
   - cover image upload/retrieval
   - audio streaming
   - HTTP Range/partial requests
   - authentication
   - authorization
   - storage-provider selection
   - R2 provider remains importable/functional
   - local fallback remains functional if applicable

18. REGRESSION TESTING:

   The current status report says:

   - Phase 1 complete
   - Phase 2 complete
   - Phase 3 complete
   - 26/26 backend tests pass
   - frontend build passes
   - frontend has already been user-tested

   Do NOT break these working features.

   Run the complete backend test suite after the change.

   Run the frontend build.

   Start the backend and frontend locally.

   Test the complete user flow:
   login → library → play → seek → playlist → like → history → upload → play uploaded song → delete song.

19. DOCUMENTATION:

   Update the architecture/database/environment documentation to clearly state:

   ACTIVE:
   MongoDB GridFS

   AVAILABLE FUTURE PROVIDER:
   Cloudflare R2

   Explain why GridFS is currently selected:
   - personal single-user application
   - current library approximately 49.6 MB
   - expected library remains within the current Atlas storage allowance
   - avoids activating R2 billing/subscription at this stage

   Also document how to switch to R2 later.

20. DO NOT CHANGE THE OVERALL PROJECT ARCHITECTURE.

   The application remains:

   React + Vite frontend
          ↓
   FastAPI backend
          ↓
   MongoDB Atlas
          ↓
   Storage abstraction
      ↙           ↘
   GridFS          R2
   ACTIVE          FUTURE/ALTERNATIVE

   The frontend must remain completely unaware of whether a song is stored in GridFS or R2.

21. IMPORTANT:
   Before modifying code, inspect the current implementation and provide a concise migration plan explaining:
   - which existing files will change
   - which new files will be created
   - how GridFS will integrate
   - how R2 will remain intact
   - how existing 12 songs will be handled
   - how streaming/range requests will work
   - how provider switching will work

   Then implement it.

22. After implementation, report:

   - files changed
   - files created
   - storage architecture
   - active provider
   - R2 status
   - GridFS status
   - current MongoDB storage usage
   - sample-song migration status
   - test results
   - frontend build result
   - exact local URLs for testing

DO NOT proceed to production deployment yet.

First make GridFS work completely and verify the entire application locally.

ADDITIONAL REQUIREMENT — PRESERVE THE LOCAL FILE FALLBACK

The existing local-file fallback is useful and MUST NOT be removed or broken.

Keep all three storage options available:

1. MongoDB GridFS — ACTIVE production storage provider for now
2. Cloudflare R2 — preserved as a future/alternative provider
3. Local filesystem — preserved as a development/testing fallback

Do not replace the local fallback with GridFS.

The storage architecture should remain provider-based:

                Storage Abstraction
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       GridFS         R2       Local Files
       ACTIVE       FUTURE       FALLBACK

Requirements:

- Existing local-file upload/streaming behavior must continue working.
- Existing local sample songs must not be deleted.
- Do not force local files to be migrated or removed just because GridFS becomes active.
- Local fallback must remain available for development/testing.
- If GridFS is selected but unavailable during local development, the existing fallback behavior may be used where appropriate.
- Do NOT silently fall back in production in a way that hides a real GridFS/R2 configuration failure.
- Keep the provider abstraction clean so GridFS, R2, and local filesystem can all implement the same storage interface.
- Existing frontend code must remain completely unaware of which storage provider is being used.

Before finishing, explicitly test:
GridFS → upload/play/seek/delete
R2 provider → remains intact
Local filesystem → upload/play/seek/delete/fallback remains intact

Do not remove or simplify the existing local fallback implementation.