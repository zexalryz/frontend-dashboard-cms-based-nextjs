# Auth Dashboard Frontend

Next.js (App Router) frontend for a role-based authentication API — login, registration, profile management, admin user administration, and automatic token refresh.

Built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS 4**.

---

## Features

### Authentication
- Login / Register (registration requires invite code)
- JWT access + refresh token storage in `localStorage`
- Auto-refresh on 401 responses — transparent to callers
- Logout invalidates refresh token server-side

### Dashboard
- Role-aware landing page after login
- Quick-links to Profile and Admin Panel (admin only)
- Displays user info: username, email, role, join date

### Profile
- View account details
- Change password
- Delete account (with confirmation, redirects to login)

### Admin / Moderator Panel
- Accessible to ADMIN and MODERATOR roles (title adapts to role)
- **Invite code generator** — count input (1–10), Generate button, auto-copy to clipboard, Copy All, read-only textarea display
- **Paginated user list** (10 per page, ADMIN only)
- **Role management** (ADMIN only) — change roles: USER / DONATOR / MODERATOR / ADMIN (self-role protected)
- **Delete users** (ADMIN only, self-delete protected)
- Action feedback messages

### Navigation
- Top nav bar with role-aware links
- Admin Panel link visible to ADMIN and MODERATOR
- Displays current username and role badge
- Logout button

---

## API Endpoints Consumed

All endpoints are relative to `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh tokens |
| POST | `/api/auth/invite-codes` | Generate invite codes (admin/moderator) |
| GET | `/api/user/profile` | Get current user profile |
| PATCH | `/api/user/profile/password` | Change password |
| DELETE | `/api/user/profile` | Delete current user |
| GET | `/api/user?skip=&take=` | List users (admin) |
| PATCH | `/api/user/:id/role` | Update user role (admin) |
| DELETE | `/api/user/:id` | Delete user (admin) |

---

## Project Structure

```
src/
├── app/
│   ├── globals.css              # Tailwind base styles
│   ├── layout.tsx               # Root layout: AuthProvider + Nav
│   ├── page.tsx                 # Login / Register page
│   ├── dashboard/
│   │   ├── page.tsx             # Dashboard home
│   │   └── admin/
│   │       └── page.tsx         # Admin panel
│   └── profile/
│       └── page.tsx             # Profile settings
├── components/
│   └── nav.tsx                  # Top navigation bar
└── lib/
    ├── api.ts                   # API client with auth & auto-refresh
    └── auth-context.tsx         # Auth state provider
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A running instance of the [auth API backend](https://github.com/your-org/your-auth-api)

### Environment

Create `.env.local` in the project root:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm run lint
```

---

## Auth Flow

1. User logs in → server returns `{ accessToken, refreshToken }` → stored in `localStorage`
2. Subsequent API calls attach `Authorization: Bearer <accessToken>` header (via `authFetch`)
3. If a 401 is returned, the client automatically calls `/api/auth/refresh` with the stored refresh token
4. On success → new tokens saved → original request retried
5. On refresh failure → tokens cleared → redirect to `/`

---

## Role System

| Role | Capabilities |
|------|-------------|
| USER | Dashboard, Profile |
| DONATOR | Dashboard, Profile |
| MODERATOR | Dashboard, Profile, Admin Panel (invite code generation) |
| ADMIN | Dashboard, Profile, Admin Panel (invite codes, user list, role changes, user deletion) |

Route guards redirect unauthorized users:
- `/dashboard` → redirects to `/` if not logged in
- `/dashboard/admin` → redirects to `/dashboard` if not ADMIN or MODERATOR
- `/profile` → redirects to `/` if not logged in
- `/` → redirects to `/dashboard` or `/dashboard/admin` if already logged in
