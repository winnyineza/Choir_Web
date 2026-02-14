# Admin Section Testing Guide

This guide helps you manually test the Choir_Web admin section.

## Prerequisites

1. **Start the application** on port 8081:
   ```bash
   npm run dev -- --port 8081
   ```
   (Or use your usual method - the app runs on port 8080 by default, use `--port 8081` if needed)

2. **Ensure Supabase is configured** – Admin login and data (members, contributions, etc.) use Supabase.

3. **Test credentials** (must exist in your Supabase `admin_users` table):
   - Email: `w.ineza@alustudent.com`
   - Password: `Igiraneza1234@ALU`

---

## Testing Checklist

### Step 1: Login Page
- [ ] Navigate to `http://localhost:8081/admin/login`
- [ ] Screenshot the login page
- [ ] Verify: "Admin Portal" heading, email input, password input, "Sign In" button
- [ ] Check browser console (F12 → Console) for JavaScript errors

### Step 2: Login
- [ ] Enter email: `w.ineza@alustudent.com`
- [ ] Enter password: `Igiraneza1234@ALU`
- [ ] Click "Sign In"
- [ ] Verify redirect to `/admin` (dashboard)
- [ ] Screenshot the admin dashboard

### Step 3: Sidebar Tabs
Click each tab and for each one:
- [ ] Take a screenshot
- [ ] Check browser console for errors
- [ ] Note any UI issues

| Tab | Route/Tab ID | Notes |
|-----|--------------|-------|
| **Members** | `members` | Data from Supabase `members` table |
| **Events** | `events` | Events list |
| **Contributions** | `contributions` | Recently fixed – verify loads without errors |
| **Attendance** | `attendance` | Attendance tracking |
| **Leave Requests** | `leave` | Leave request management |
| **Settings** | `settings` | Only visible to Super Admin / Main Admin |

### Step 4: Members Tab – Supabase Data
- [ ] Open Members tab
- [ ] Confirm member list loads (from Supabase)
- [ ] Check for loading spinners, empty states, or errors
- [ ] Open DevTools → Network: look for Supabase API calls

### Step 5: Contributions Tab
- [ ] Open Contributions tab
- [ ] Confirm it loads without console errors
- [ ] Check for Monthly/Special contributions sections
- [ ] Verify contribution types and records display

---

## Common Issues

### Blank Page
- Ensure the dev server is running
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Check console for errors

### Login Fails
- Confirm the admin user exists in Supabase `admin_users`
- Check `supabaseAuthService` – it uses Supabase for auth

### Tab Not Visible
- Visibility depends on admin role (see `getAccessibleTabs` in `adminService.ts`)
- `Settings` is only for `super_admin` and `main_admin`

### No Data in Members/Contributions
- Confirm Supabase is configured (`.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- Check Supabase project is running and tables exist

---

## E2E Tests (Playwright)

Automated E2E tests are in `e2e/admin-section.spec.ts`.

**Note:** Playwright tests may not render the React app correctly in the current setup (root stays empty). If you need automated tests, consider:
- Running against a production build (`npm run build && npm run preview`)
- Or debugging the Playwright/Vite dev server interaction

**Run E2E tests:**
```bash
# With app running on 8081
BASE_URL=http://localhost:8081 npm run test:e2e:admin

# Or if app runs on 8080
BASE_URL=http://localhost:8080 npm run test:e2e:admin
```
