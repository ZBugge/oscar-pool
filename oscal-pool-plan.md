# Oscar Pool - Implementation Plan

## Summary

Create a new "Oscar Pool" application for predicting Oscar winners, based on the NFL Playoff Predictor architecture. The app allows admins to create lobbies with invite codes, participants to submit predictions for all Oscar categories, and displays a live leaderboard during the ceremony.

---

## Progress Tracker

| Phase | Status | Commit | Notes |
|-------|--------|--------|-------|
| 1. Project Setup | ✅ | 623d903 | Complete |
| 2. Database & Auth | 🔄 | - | In progress |
| 3. Category Management | ⬜ | - | |
| 4. Lobby System | ⬜ | - | |
| 5. Predictions | ⬜ | - | |
| 6. Leaderboard | ⬜ | - | |
| 7. Polish | ⬜ | - | |
| 8. Deploy | ⬜ | - | |

**Legend:** ⬜ Pending | 🔄 In Progress | ✅ Complete

---

## Project Decisions (From User)

| Decision | Choice |
|----------|--------|
| Project location | New separate repository |
| App name | Oscar Pool |
| Data entry | Admin creates categories/nominees manually |
| Scoring | Simple (1 point per correct) |
| Prediction lock | Admin manually locks |
| Edit predictions | No editing after submission |
| Winner recording | Admin manually selects |
| Theme | Oscar gold/black |
| Tiebreaker | None (shared ranks) |
| Multi-year support | No (single ceremony focus) |
| Features | All core features from NFL Predictor |
| Prediction visibility | Hidden until admin locks lobby |
| Leaderboard updates | Auto-refresh polling (30 seconds) |
| Results view | Detailed breakdown (pick vs winner per category) |
| Scale | Small (5-20 people per lobby) |

---

## Database Schema

```sql
-- Admin accounts
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System configuration for limits
CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  max_admins INTEGER NOT NULL DEFAULT 100,
  max_lobbies_per_admin INTEGER NOT NULL DEFAULT 10,
  max_participants_per_lobby INTEGER NOT NULL DEFAULT 50,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Oscar categories (e.g., "Best Picture", "Best Actor")
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Nominees within categories
CREATE TABLE IF NOT EXISTS nominees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_winner BOOLEAN DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  UNIQUE(category_id, name)
);

-- Lobbies with invite codes
CREATE TABLE IF NOT EXISTS lobbies (
  id TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',  -- 'open', 'locked', 'completed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  locked_at DATETIME,
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- Participants (anonymous users who join lobbies)
CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lobby_id TEXT NOT NULL,
  name TEXT NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lobby_id) REFERENCES lobbies(id),
  UNIQUE(lobby_id, name)
);

-- Predictions (one per participant per category)
CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  nominee_id INTEGER NOT NULL,
  FOREIGN KEY (participant_id) REFERENCES participants(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (nominee_id) REFERENCES nominees(id),
  UNIQUE(participant_id, category_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nominees_category ON nominees(category_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_admin ON lobbies(admin_id);
CREATE INDEX IF NOT EXISTS idx_participants_lobby ON participants(lobby_id);
CREATE INDEX IF NOT EXISTS idx_predictions_participant ON predictions(participant_id);
```

---

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` - Create admin account
- `POST /login` - Admin login
- `POST /logout` - Admin logout
- `GET /me` - Get current admin

### Categories (`/api/category`) - Admin only
- `GET /` - Get all categories with nominees
- `POST /` - Create category
- `PATCH /:id` - Update category name/order
- `DELETE /:id` - Delete category
- `POST /:id/nominees` - Add nominee to category
- `DELETE /:categoryId/nominees/:nomineeId` - Remove nominee
- `POST /:categoryId/nominees/:nomineeId/winner` - Set winner
- `DELETE /:categoryId/winner` - Clear winner

### Lobbies (`/api/lobby`)
- `POST /create` - Create lobby (auth required)
- `GET /my-lobbies` - Get admin's lobbies (auth required)
- `GET /:id` - Get lobby details (public)
- `GET /:id/categories` - Get categories for prediction form (public)
- `PATCH /:id/lock` - Lock lobby (auth required)
- `PATCH /:id/unlock` - Unlock lobby (auth required)
- `PATCH /:id/complete` - Mark complete (auth required)
- `DELETE /:lobbyId/participants/:participantId` - Remove participant (auth)
- `POST /:lobbyId/participants/bulk-delete` - Bulk delete (auth)
- `DELETE /:lobbyId` - Delete lobby (auth)

### Participants (`/api/participant`)
- `POST /submit` - Submit predictions (public, lobby must be open)
- `GET /:lobbyId/participants` - List participants
- `GET /:participantId/picks?lobbyId=` - Get detailed picks

### Leaderboard (`/api/leaderboard`)
- `GET /:lobbyId` - Get leaderboard with scores and stats

### Admin Stats (`/api/admin`)
- `GET /stats` - System statistics (auth required)

---

## Frontend Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home | Landing page with Oscar theme |
| `/login` | Login | Admin login |
| `/register` | Register | Admin registration |
| `/admin` | AdminDashboard | Lobby list + category management link |
| `/admin/categories` | CategoryManagement | CRUD categories/nominees, set winners |
| `/admin/create-lobby` | CreateLobby | Create new lobby |
| `/join/:lobbyId` | JoinLobby | Submit predictions |
| `/leaderboard/:lobbyId` | Leaderboard | Live scores with auto-refresh |

---

## Key Differences from NFL Predictor

| NFL Predictor | Oscar Pool |
|---------------|------------|
| Seasons + Games | Categories + Nominees |
| Bracket with re-seeding | Flat list of categories |
| Teams/Seeds | Nominees |
| Simple + Weighted scoring | Simple only (1 point each) |
| ESPN integration | Manual winner selection |
| Super admin role | All admins equal |
| Status: open/in_progress/completed | Status: open/locked/completed |

---

## File Structure

```
oscar-pool/
├── package.json
├── CLAUDE.md
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css           # Gold/black Oscar theme
│       ├── api/api.ts
│       ├── components/PicksModal.tsx
│       └── pages/
│           ├── Home.tsx
│           ├── Login.tsx
│           ├── Register.tsx
│           ├── AdminDashboard.tsx
│           ├── CategoryManagement.tsx
│           ├── CreateLobby.tsx
│           ├── JoinLobby.tsx
│           └── Leaderboard.tsx
└── server/
    ├── package.json
    └── src/
        ├── index.ts
        ├── auth/auth.ts
        ├── db/schema.ts
        ├── middleware/auth.ts
        ├── routes/
        │   ├── auth.ts
        │   ├── category.ts
        │   ├── lobby.ts
        │   ├── participant.ts
        │   ├── leaderboard.ts
        │   └── admin.ts
        └── services/
            ├── category.ts
            ├── lobby.ts
            ├── participant.ts
            ├── leaderboard.ts
            └── limits.ts
```

---

## Oscar Theme Colors

```css
/* Background - elegant dark */
body {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
}

/* Primary accent - Oscar gold */
.btn-primary {
  background: linear-gradient(135deg, #d4af37 0%, #c5a028 100%);
  color: #1a1a1a;
}

/* Headings */
h1, h2 { color: #d4af37; }

/* Cards - off-white */
.card { background: #fafafa; border: 1px solid #e0d9c8; }
```

---

## Implementation Order

1. **Project Setup** - Create repo, monorepo structure, dev scripts
2. **Database & Auth** - Schema, admin authentication (copy from NFL Predictor)
3. **Category Management** - CRUD for categories/nominees, winner selection
4. **Lobby System** - Create/lock/manage lobbies
5. **Predictions** - Submit predictions UI and backend
6. **Leaderboard** - Scoring, ranks, auto-refresh, picks modal
7. **Polish** - Theme, Home page, responsive design
8. **Testing & Deploy** - Tests, Railway deployment

---

## Reference Files from NFL Predictor

Copy patterns from these files (located at `c:\Users\ZachBugge\nfl-playoff-predictor\`):

- `server/src/db/schema.ts` - Database helpers (initDb, saveDb, runQuery, runExec)
- `server/src/auth/auth.ts` - Password hashing and verification
- `server/src/middleware/auth.ts` - Session auth middleware
- `server/src/services/lobby.ts` - Lobby CRUD with nanoid
- `server/src/services/leaderboard.ts` - Scoring calculation pattern
- `client/src/api/api.ts` - API client structure with credentials
- `client/src/pages/JoinLobby.tsx` - Prediction form UI pattern
- `client/src/pages/Leaderboard.tsx` - Leaderboard with auto-refresh

---

## SQLite Boolean Reminder

Always use ternary operators for SQLite booleans:
```tsx
// GOOD
{nominee.is_winner ? <WinnerBadge /> : null}
{!!nominee.is_winner && <WinnerBadge />}

// BAD - renders "0"
{nominee.is_winner && <WinnerBadge />}
```

---

## Verification Plan

1. **Auth**: Register admin, login, logout, verify session persists
2. **Categories**: Create category, add nominees, reorder, delete
3. **Lobby**: Create lobby, copy invite link, lock/unlock
4. **Join**: Open invite link, enter name, submit picks for all categories
5. **Winners**: Set winners for categories, verify scores update
6. **Leaderboard**: Check scores, verify auto-refresh, view participant picks
7. **Edge cases**: Duplicate names rejected, locked lobby rejects submissions

---

## Critical Patterns from NFL Predictor (CLAUDE.md)

### Development Commands
```bash
# Root (monorepo orchestration)
npm run dev           # Run client + server concurrently
npm run dev:server    # Backend only (localhost:3001)
npm run dev:client    # Frontend only (localhost:5173)
npm run build         # Build both client and server
npm start             # Start production server

# Server (from server/)
npm run dev           # tsx watch with live reload
npm run build         # TypeScript compilation
npm test              # Run vitest tests

# Client (from client/)
npm run dev           # Vite dev server
npm run build         # TypeScript check + Vite build
npm test              # Run vitest tests
```

### sql.js API Pattern
```typescript
const stmt = db.prepare("SELECT * FROM table WHERE id = ?");
stmt.bind([id]);
if (stmt.step()) {
  const result = stmt.getAsObject();
}
stmt.free();
// Must call saveDb() after mutations
```

### Authentication Pattern
- Session-based with `express-session`
- Middleware checks `req.session.adminId`
- Frontend fetch calls MUST use `credentials: 'include'`

### Environment Configuration
- **Development**: CORS enabled, API proxy at `/api` → `localhost:3001`
- **Production**: Same-origin (CORS disabled), secure cookies, `NODE_ENV=production`, `SESSION_SECRET` required

### Git Workflow
**Do NOT push to remote until user has verified the feature works locally.** Commit changes locally, then wait for human confirmation before running `git push`.

---

## Railway Deployment (from DEPLOYMENT-LESSONS-LEARNED.md)

### Critical Middleware Order
```typescript
// 1. TRUST PROXY (for secure cookies behind Railway)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 2. SERVE STATIC FILES FIRST (in production)
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
}

// 3. CORS (only in development - same-origin in prod doesn't need it)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }));
}

// 4. BODY PARSERS
app.use(express.json());

// 5. SESSION MIDDLEWARE
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,  // 7 days
  },
}));

// 6. API ROUTES
app.use('/api/auth', authRoutes);
// ... more routes

// 7. SPA FALLBACK (MUST BE LAST!)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}
```

### Root package.json Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "npm run dev --prefix server",
    "dev:client": "npm run dev --prefix client",
    "build": "cd client && npm run build && cd ../server && npm run build",
    "start": "npm run start --prefix server",
    "postinstall": "npm install --prefix server && npm install --prefix client"
  }
}
```

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && bash build.sh"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### build.sh
```bash
#!/bin/bash
set -ex

echo "Building client..."
cd client
npm run build
cd ..

echo "Building server..."
cd server
npm run build
cd ..

echo "Build complete!"
```

### Environment Variables (Railway)
```bash
NODE_ENV=production
SESSION_SECRET=<64-char-hex-string>  # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DATABASE_PATH=/data/database.db      # Requires Railway Volume mounted at /data
```

### Railway Volume for SQLite Persistence
1. Railway Dashboard → Your Service → Settings
2. Scroll to **Volumes** → Click **Add Volume**
3. Mount path: `/data`
4. Add env var: `DATABASE_PATH=/data/database.db`
5. Server code must use: `const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../database.db');`

### Common Deployment Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| Static files blocked by CORS | 500 errors on assets, MIME type errors | Move `express.static()` BEFORE `cors()` |
| Session cookies not persisting | 401 on `/api/auth/me` after login | Disable CORS in prod (same-origin), use `sameSite: 'lax'` |
| Secure cookies not setting | Login succeeds but no cookie set | Add `app.set('trust proxy', 1)` in production |
| Database resets on deploy | Data lost after each deployment | Enable Railway Volume at `/data` |

---

## TypeScript Interfaces

### Server-side (schema.ts)
```typescript
export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  display_order: number;
  created_at: string;
}

export interface Nominee {
  id: number;
  category_id: number;
  name: string;
  is_winner: number; // SQLite boolean (0/1)
}

export interface Lobby {
  id: string;
  admin_id: number;
  name: string;
  status: 'open' | 'locked' | 'completed';
  created_at: string;
  locked_at: string | null;
}

export interface Participant {
  id: number;
  lobby_id: string;
  name: string;
  submitted_at: string;
}

export interface Prediction {
  id: number;
  participant_id: number;
  category_id: number;
  nominee_id: number;
}
```

### Client-side (api.ts)
```typescript
interface Admin {
  id: number;
  username: string;
}

interface Category {
  id: number;
  name: string;
  display_order: number;
}

interface CategoryWithNominees extends Category {
  nominees: Nominee[];
  winner_id: number | null;
}

interface Nominee {
  id: number;
  category_id: number;
  name: string;
  is_winner: boolean;
}

interface Lobby {
  id: string;
  admin_id: number;
  name: string;
  status: 'open' | 'locked' | 'completed';
  participant_count?: number;
}

interface LeaderboardEntry {
  participantId: number;
  name: string;
  score: number;
  correctPicks: number;
  totalPicks: number;
  rank: number;
}

interface ParticipantPick {
  categoryId: number;
  categoryName: string;
  nomineeId: number;
  nomineeName: string;
  winnerId: number | null;
  winnerName: string | null;
  isCorrect: boolean | null; // null if winner not announced
}
```

---

## CLAUDE.md for Oscar Pool

Create this file in the new repository:

```markdown
# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Development Commands

### Root (monorepo orchestration)
```bash
npm run dev           # Run client + server concurrently
npm run dev:server    # Backend only (localhost:3001)
npm run dev:client    # Frontend only (localhost:5173)
npm run build         # Build both client and server
npm start             # Start production server
```

### Server (from server/)
```bash
npm run dev           # tsx watch with live reload
npm run build         # TypeScript compilation
npm test              # Run vitest tests
```

### Client (from client/)
```bash
npm run dev           # Vite dev server
npm run build         # TypeScript check + Vite build
npm test              # Run vitest tests
```

## Architecture

**Monorepo** with `client/` (React + Vite) and `server/` (Express + TypeScript).

### Tech Stack
- **Frontend**: React 18, Vite, React Router, TypeScript
- **Backend**: Express, sql.js (SQLite), Express Session, bcryptjs
- **Testing**: Vitest
- **Deployment**: Railway

### Key Directories
- `server/src/routes/` - API endpoints (auth, category, lobby, participant, leaderboard)
- `server/src/services/` - Business logic (category management, scoring)
- `server/src/db/schema.ts` - Database schema and query utilities
- `client/src/pages/` - Page components
- `client/src/api/api.ts` - API client with fetch wrapper

### Database (sql.js)
Tables: `admins`, `system_config`, `categories`, `nominees`, `lobbies`, `participants`, `predictions`

sql.js API pattern:
```typescript
const stmt = db.prepare("SELECT * FROM table WHERE id = ?");
stmt.bind([id]);
if (stmt.step()) {
  const result = stmt.getAsObject();
}
stmt.free();
// Must call saveDb() after mutations
```

**CRITICAL: SQLite Boolean Gotcha**
SQLite stores booleans as integers (0/1). In React, this causes a rendering bug:
```tsx
// BAD - renders "0" when is_winner is 0
{nominee.is_winner && <WinnerBadge />}

// GOOD - renders nothing when is_winner is 0
{nominee.is_winner ? <WinnerBadge /> : null}
{!!nominee.is_winner && <WinnerBadge />}
```

### Authentication
Session-based with `express-session`. Middleware checks `req.session.adminId`. Frontend fetch calls require `credentials: 'include'`.

### Environment
- **Development**: CORS enabled, API proxy at `/api` → `localhost:3001`
- **Production**: Same-origin (CORS disabled), secure cookies, `NODE_ENV=production`, `SESSION_SECRET` required

### Git Workflow
**Do NOT push to remote until user has verified the feature works locally.**

### Deployment
Railway with Nixpacks builder. Critical: Express static file middleware must come BEFORE any other middleware. Use `trust proxy` for secure cookies.
```
