# Copilot Instructions - Hockey App

## Project Overview
Hockey app is a **monorepo** tournament management platform for rink hockey using **Next.js** (web), **NestJS** (API), **PostgreSQL**, and **Docker Compose**.

### Architecture
- **`apps/api`** — NestJS REST backend with Prisma ORM, Swagger docs at `/api/docs`
- **`apps/web`** — Next.js 14 frontend, mobile-first responsive design
- **`packages/shared`** — TypeScript enums shared across API/web: `Sport`, `Tiebreak`, `PhaseType`, `LegsMode`
- **Infrastructure** — PostgreSQL + Docker Compose for local dev; polling HTTP (no WebSocket in MVP)

### Data Model
- **Competition → Season → Phase (LEAGUE) → Matches + Standings**
- **RuleSet** (per season): configurable points and tiebreak order
- **SeasonTeam** with optional seed (ranking)
- **Stand ingsRow** calculated by standings endpoint (not materialized)

---

## Development Workflows

### Local Setup (npm workspaces)
```bash
npm install
npm run prisma:generate -w @hockey/api          # Generate Prisma client
npm run prisma:migrate -w @hockey/api            # DB schema sync
npm run prisma:seed -w @hockey/api               # Load seed data
npm test -w @hockey/api                          # Run Jest (--runInBand)
npm run dev -w @hockey/api                       # ts-node (hot reload)
npm run build && npm run start -w @hockey/api   # Production
```

### Docker  
```bash
docker compose up --build
```
- **Database URL**: `postgresql://postgres:postgres@db:5432/hockey`
- **API**: port 3001, **Web**: port 3000

### Testing
- Jest with `ts-jest` preset, roots in `test/` folder
- Mock Prisma service in unit tests (see `apps/api/test/admin.service.spec.ts`)
- Path alias configured: `@hockey/shared → ../../packages/shared/src`
- Run: `npm test -w @hockey/api`

---

## Key Patterns & Conventions

### NestJS Service/Controller
- **Dependency injection** via constructor (e.g., `PrismaService`)
- **DTOs** validate input with `class-validator` decorators + `class-transformer`
- **Controllers** decorated with `@ApiTags`, `@Post`, `@Put`, `@Get` for Swagger
- **Exceptions**: `BadRequestException`, `ConflictException`, `NotFoundException`

**Example** (`apps/api/src/admin/admin.service.ts`):
- Domain validation: only `Sport.RINK_HOCKEY` allowed
- Duplicate detection: check Set before inserts, use `findUnique` by composite keys
- Tiebreak validation: must match `Tiebreak` enum from shared

### Prisma Patterns
- **PrismaService** extends `PrismaClient`, implements `OnModuleInit` for auto-connect
- Use composite keys: `@@id([seasonId, teamId])` for SeasonTeam
- Database migrations via `prisma db push` (not migration files, development-first)
- Seed with `ts-node prisma/seed.ts`

### Standalone Business Logic
- **Scheduler** (`apps/api/src/league/scheduler.ts`): pure function `generateRoundRobin(teamIds, legsMode)` exported
- Returns array of `Pair { homeTeamId, awayTeamId, round }`
- Validates even number of teams ≥2
- Supports `SINGLE_LEG` and `DOUBLE_LEG` (inverted home/away on second leg)

### Standings Calculation  
- **Public controller** (`apps/api/src/public/public.controller.ts`):
  - Fetches `RuleSet.tiebreakOrder` from season
  - Sorts `StandingsRow` by tiebreak priority: `POINTS` > `HEAD_TO_HEAD_POINTS` > `GOAL_DIFFERENCE` > `GOALS_FOR`
  - Falls back to `teamId` lexicographic comparison for ties

---

## Domain Knowledge

### Tournament Scope (MVP Constraints)
- **Sport**: RINK_HOCKEY only (enforced on creation)
- **Format**: League phase only (no KO yet)
- **Duration**: Configurable `periodsCount` (default 2) + `periodMinutes` (default 25)
- **Tiebreaks**: Limited catalog in `@hockey/shared` enum
- **Legs**: `SINGLE_LEG` or `DOUBLE_LEG` round-robin scheduling

### Validation Rules
- Competition slug must be unique
- Season requires valid competitionId
- Teams cannot be assigned twice to same season (composite unique key)
- RuleSet tiebreak array cannot be empty
- Category defaults: 2 periods × 25 mins

---

## Key Files to Know
- `apps/api/prisma/schema.prisma` — Single source of truth for data model
- `apps/api/src/app.module.ts` — DI configuration (controllers, providers)
- `apps/api/src/dto/admin.dto.ts` — All admin input validation schemas
- `packages/shared/src/index.ts` — Shared enums (import from `@hockey/shared`)
- `docker-compose.yml` — Service orchestration, env vars
- `package.json` — npm workspaces definition

---

## Common Tasks

**Add admin endpoint:**
1. Define DTO in `dto/admin.dto.ts` with validators
2. Add method to `admin.service.ts` with Prisma calls
3. Add `@Post/@Put` decorator to `admin.controller.ts`
4. Import Swagger `@ApiTags` and validate against PLAN_MVP.md scope

**Query standings:**
Access `GET /public/phases/:phaseId/standings` → returns sorted rows by RuleSet tiebreakOrder

**Debug Prisma:**
Run `npx prisma studio --schema prisma/schema.prisma` for visual database inspection

---

## Notes
- No Redis or BullMQ in MVP; use polling for live updates
- Environment: use `.env` or pass `DATABASE_URL` at runtime
- API Swagger docs auto-generated from decorators (keep in sync with actual implementation)
