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
**Do NOT push to remote until user has verified the feature works locally.** Commit changes locally, then wait for human confirmation before running `git push`.

### Deployment
Railway with Nixpacks builder. Critical: Express static file middleware must come BEFORE any other middleware. Use `trust proxy` for secure cookies.

test

### Environment Variables (Railway)
```bash
NODE_ENV=production
SESSION_SECRET=<64-char-hex-string>  # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DATABASE_PATH=/data/database.db      # Requires Railway Volume mounted at /data
```
