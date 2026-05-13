# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js Version Warning

This project uses **Next.js 16.2.3** — a breaking-change release. APIs, conventions, and file structure may differ from training data. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code.

## Commands

```bash
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
npx tsc --noEmit     # Type-check without emitting
npm run docker:up    # Start Docker (detached)
npm run docker:down  # Stop Docker
npm run clean        # Remove .next and node_modules (PowerShell)
```

No test runner is configured. HR_ROADMAP.md references `npm run test -- <file>.test.ts` as a future target.

## Architecture

### Data Flow

```
Firebase Auth → auth-context.tsx (React Context)
                     ↓
             Dashboard layout (route group)
                     ↓
          TanStack Query + services/db/*
                     ↓
              Firestore collections
```

Auth state lives in `src/context/auth-context.tsx`. Role is derived from email (`admin@hr.local` → admin). All dashboard routes are under `src/app/(dashboard)/` and protected by the layout.

### Service Layer

`src/services/db/` contains one file per Firestore collection (employees, attendance, leaves, recruitment, performance, trainings, benefits, system). All Firestore queries go through these files — never query Firestore directly in components.

### Key Firestore Collections

| Collection | Purpose |
|---|---|
| `employees` | Core records; `authId` links to Firebase Auth |
| `departments` | Org structure; `managerId` ref |
| `attendance` | Check-in/out events array per day |
| `leaves` / `leave_balances` | Requests + per-employee balances (separate for RBAC) |
| `candidates` / `jobs` | ATS pipeline |
| `reviews` | 360 performance reviews by period (e.g. `2026-Q1`) |
| `trainings` / `employee_trainings` | Compliance tracking with `expiryDate` |
| `benefits` / `employee_benefits` | Benefit catalog + enrollments |
| `system_stats` | Pre-aggregated dashboard metrics (updated by Cloud Functions) |

### Path Alias

`@/*` maps to `./src/*` (tsconfig).

### UI Stack

shadcn/ui components live in `src/components/ui/`. Theme: radix-luma, base color: neutral. Add new shadcn components with `npx shadcn add <component>`. Feature-specific components go in `src/components/features/<module>/`.

### Business Logic Invariants

- Leave auto-approval triggers when: < 3 days requested + sufficient balance + < 20% of department on leave
- Attendance session auto-closes after 12h without an 'out' event (flags record for HR review)
- `system_stats` metrics are maintained by Cloud Functions on Firestore write events — never update them directly from the client
- "Hire" action in recruitment copies candidate data to `employees` and triggers onboarding

## Environment

Firebase config in `.env.local` as `NEXT_PUBLIC_*` vars. Project ID: `hrsys-50919`.
