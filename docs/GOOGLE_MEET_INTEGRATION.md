# Google Calendar + Meet Integration

## What was added

- Netlify function `/.netlify/functions/google-oauth-start`
- Netlify function `/.netlify/functions/google-oauth-callback`
- Netlify function `/.netlify/functions/google-meetings`
- Frontend service `src/lib/googleMeetService.ts`
- Meeting Minutes UI wiring in `src/components/admin/MeetingMinutes.tsx`
- Supabase migration `supabase/migration-google-meet-integration.sql`

## Security safeguards implemented

- OAuth scope minimization: `https://www.googleapis.com/auth/calendar.events`
- Refresh token encryption at rest with AES-256-GCM
- Token key provided by `GOOGLE_TOKEN_ENCRYPTION_KEY` (base64, 32-byte key)
- Admin role gate in backend using active `admin_users` check via `X-Admin-Id`
- Audit log entries for OAuth start/connect and meeting create/update/delete
- Basic request rate limiting in `google-meetings` function
- OAuth CSRF protection using one-time state records in `google_oauth_states`

## Required environment variables (Netlify)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_TOKEN_ENCRYPTION_KEY` (base64-encoded 32-byte key)
- `URL` (Netlify site URL)

Generate encryption key example:

```bash
openssl rand -base64 32
```

## Google Cloud setup

1. Create OAuth 2.0 Web application credentials.
2. Add authorized redirect URI:
   - `https://<your-site>/.netlify/functions/google-oauth-callback`
3. Enable Google Calendar API.
4. Configure OAuth consent screen.

## Supabase setup

Run:

```sql
-- apply migration
\i supabase/migration-google-meet-integration.sql
```

(or apply same SQL via Supabase SQL editor)

## Admin usage flow

1. Open Admin Meeting Minutes page.
2. Click **Connect Google** once (owner/admin account consent).
3. Create or edit a meeting with **Create/update Google Meet link** checked.
4. System stores Google event + Meet metadata on meeting record.
5. Deleting a meeting also deletes linked Google event when present.

## Important note

Current backend gate checks active admin by `X-Admin-Id`. For stronger server-side guarantees, migrate admin auth from localStorage sessions to signed server-validated tokens/JWT.
