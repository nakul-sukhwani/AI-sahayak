# Project Architecture & Guidelines

This document details the project structure, database schema, and specific agent rules for the **nagrik-seva** workspace to guide Antigravity and other AI agents.

## Repository Structure

```
nagrik-seva/
├── .env.local
├── .env.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   ├── favicon.ico
│   └── icons/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── worker/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── supervisor/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── verify/
│   │   │       └── page.tsx
│   │   └── admin/
│   │       └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Toast.tsx
│   │   ├── auth/
│   │   │   └── OTPForm.tsx
│   │   ├── complaints/
│   │   │   ├── PhotoCapture.tsx
│   │   │   ├── VoiceInput.tsx
│   │   │   ├── MapPicker.tsx
│   │   │   ├── AIResultCard.tsx
│   │   │   ├── AuthoritySuggestion.tsx
│   │   │   ├── ComplaintCard.tsx
│   │   │   ├── ComplaintForm.tsx
│   │   │   └── ComplaintTimeline.tsx
│   │   ├── worker/
│   │   │   ├── AssignmentCard.tsx
│   │   │   ├── ProofSubmission.tsx
│   │   │   └── BeforeAfterView.tsx
│   │   ├── supervisor/
│   │   │   ├── AssignmentQueue.tsx
│   │   │   ├── AssignWorkerModal.tsx
│   │   │   └── VerificationQueue.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   └── providers/
│   │       └── SupabaseProvider.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── gemini.ts
│   │   ├── pdf.ts
│   │   ├── rate-limit.ts
│   │   ├── image.ts
│   │   └── utils.ts
│   │
│   ├── types/
│   │   ├── complaint.ts
│   │   ├── user.ts
│   │   ├── authority.ts
│   │   ├── ai.ts
│   │   └── work-proof.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useComplaints.ts
│   │   ├── useGeolocation.ts
│   │   ├── useVoiceInput.ts
│   │   └── useWorkerAssignments.ts
│   │
│   ├── constants/
│   │   ├── issue-types.ts
│   │   ├── severities.ts
│   │   ├── statuses.ts
│   │   ├── authorities.ts
│   │   └── roles.ts
│   │
│   ├── prompts/
│   │   ├── analyze-complaint.ts
│   │   └── verify-proof.ts
│   │
│   └── _trash/
│       └── .gitkeep
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_users_profile.sql
│   │   ├── 002_create_authorities.sql
│   │   ├── 003_create_wards.sql
│   │   ├── 004_create_complaints.sql
│   │   ├── 005_create_audit_logs.sql
│   │   ├── 006_create_workers.sql
│   │   └── 007_create_work_proof.sql
│   ├── seed/
│   │   ├── bangalore_authorities.sql
│   │   └── demo_workers.sql
│   └── rls/
│       ├── users_profile.sql
│       ├── complaints.sql
│       ├── audit_logs.sql
│       ├── workers.sql
│       └── work_proof.sql
│
└── tests/
    ├── gemini-response.test.ts
    └── proof-verification.test.ts
```

## Database Schema

```sql
-- User profile
CREATE TABLE users_profile (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         TEXT NOT NULL,
  full_name     TEXT,
  display_name  TEXT,
  ward_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'citizen'
                CHECK (role IN ('citizen', 'worker', 'supervisor', 'officer', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Authorities
CREATE TABLE authorities (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  department    TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  city          TEXT NOT NULL DEFAULT 'Bangalore',
  issue_types   TEXT[] NOT NULL,
  wards         TEXT[] NOT NULL
);

-- Wards
CREATE TABLE wards (
  id            SERIAL PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL,
  city          TEXT NOT NULL DEFAULT 'Bangalore',
  center_lat    NUMERIC(10, 7),
  center_lng    NUMERIC(10, 7),
  boundary_geo  JSONB
);

-- Complaints
CREATE TABLE complaints (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users_profile(id),
  latitude              NUMERIC(10, 7) NOT NULL,
  longitude             NUMERIC(10, 7) NOT NULL,
  address               TEXT,
  ward_name             TEXT,
  issue_type            TEXT NOT NULL,
  subcategory           TEXT,
  severity              TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description_en        TEXT NOT NULL,
  description_hi        TEXT,
  user_notes            TEXT
);
```

## Development Rules

1. **Read Before Writing**: Before creating any file, read all existing files in that directory. Never create a file that conflicts with or duplicates existing code.
2. **One Task Per Response**: Execute exactly one atomic task per response. Do not chain unrelated changes.
3. **Complete Files Only**: Never output partial files with placeholders. Every file must be complete, runnable, and importable.
4. **No Placeholder Code**: Replace every TODO, FIXME, placeholder, or mock data with actual working implementation.
5. **Import What You Use**: Every import must be used. Every used module must be imported. No orphan imports, no missing imports.
6. **Type Everything**: Use TypeScript strict mode. Every parameter, return type, and state variable gets an explicit type.
7. **Error Boundaries Everywhere**: Every async operation gets try/catch. Every API route validates with Zod. Every database query handles errors.
8. **Follow Existing Patterns**: Replicate existing patterns exactly. Do not introduce a new pattern for the same operation.
9. **No Dead Code**: Do not comment out code. If something is no longer needed, move it to `_trash/`.
10. **Environment Variables Over Hardcodes**: Never hardcode secrets. Use `process.env.VARIABLE_NAME`.
11. **Mobile-First CSS**: Every component must be usable on 375px before desktop optimization.
12. **Server Client vs Browser Client**: Use `supabase/server.ts` in Next.js Server Components (`layout.tsx`, `page.tsx`, `route.ts`). Use `supabase/client.ts` only in client components and hooks.
13. **Components Under 150 Lines**: If a component exceeds 150 lines, extract sub-components.
14. **Trash Folder Protocol**: When removing code, move it to `_trash/` with a descriptive filename. Never import from `_trash/` into production code.
