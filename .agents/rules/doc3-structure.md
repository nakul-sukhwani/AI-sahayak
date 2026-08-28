# DOC 3: PROJECT STRUCTURE

## 3.1 Repository Structure

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

## 3.2 Database Schema

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

  -- Location
  latitude              NUMERIC(10, 7) NOT NULL,
  longitude             NUMERIC(10, 7) NOT NULL,
  address               TEXT,
  ward_name             TEXT,

  -- Issue details
  issue_type            TEXT NOT NULL,
  subcategory           TEXT,
  severity              TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Content
  description_en        TEXT NOT NULL,
  description_hi        TEXT,
  user_notes            TEXT,

  -- AI metadata
  ai_confidence         NUMERIC(3, 2),
  ai_tags               TEXT[],
  ai_urgency_reason     TEXT,
  ai_suggested_department TEXT,

  -- Privacy
  is_anonymous          BOOLEAN DEFAULT false,
  visibility            TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared')),

  -- Authority routing
  suggested_authority_id INTEGER REFERENCES authorities(id),

  -- Assignment
  ai_suggested_worker_id UUID REFERENCES users_profile(id),
  assigned_to           UUID REFERENCES users_profile(id),
  assigned_by           UUID REFERENCES users_profile(id),
  assigned_at           TIMESTAMPTZ,

  -- Media
  image_url             TEXT NOT NULL,
  voice_url             TEXT,

  -- Status
  status                TEXT NOT NULL DEFAULT 'filed'
                        CHECK (status IN ('draft', 'filed', 'assigned', 'in_progress',
                                          'proof_submitted', 'resolved', 'rejected')),
  status_updated_at     TIMESTAMPTZ DEFAULT now(),

  -- Timestamps
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Workers
CREATE TABLE workers (
  user_id               UUID PRIMARY KEY REFERENCES users_profile(id),
  area_name             TEXT NOT NULL,
  department            TEXT NOT NULL,
  is_available          BOOLEAN DEFAULT true,
  max_concurrent_tasks  INT DEFAULT 3,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Work proof
CREATE TABLE work_proof (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id          UUID NOT NULL REFERENCES complaints(id),
  worker_id             UUID NOT NULL REFERENCES users_profile(id),

  -- Photos
  before_photo_url      TEXT,
  after_photo_url       TEXT NOT NULL,

  -- Worker input
  worker_notes          TEXT,
  submitted_at          TIMESTAMPTZ DEFAULT now(),

  -- AI verification
  ai_verified           BOOLEAN,
  ai_confidence         NUMERIC(3, 2),
  ai_observation        TEXT,
  ai_remaining_issues   TEXT,
  ai_new_issues         TEXT,
  ai_analyzed_at        TIMESTAMPTZ,

  -- Human verification
  verified_by           UUID REFERENCES users_profile(id),
  verified_at           TIMESTAMPTZ,
  status                TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending', 'ai_verified', 'approved', 'rejected')),
  rejection_reason      TEXT
);

-- Audit logs
CREATE TABLE audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES users_profile(id),
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Reports
CREATE TABLE reports (
  id            BIGSERIAL PRIMARY KEY,
  reporter_id   UUID REFERENCES users_profile(id),
  complaint_id  UUID REFERENCES complaints(id),
  reason        TEXT NOT NULL,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_ward ON complaints(ward_name);
CREATE INDEX idx_complaints_created ON complaints(created_at DESC);
CREATE INDEX idx_complaints_assigned ON complaints(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_work_proof_complaint ON work_proof(complaint_id);
CREATE INDEX idx_work_proof_worker ON work_proof(worker_id);
CREATE INDEX idx_work_proof_status ON work_proof(status);
CREATE INDEX idx_workers_department ON workers(department);
CREATE INDEX idx_workers_available ON workers(is_available) WHERE is_available = true;
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

## 3.3 RLS Policies

```sql
-- users_profile: users see/edit own
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON users_profile FOR ALL USING (auth.uid() = id);

-- complaints: role-based
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "citizens_own_complaints" ON complaints
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "workers_see_assigned" ON complaints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker')
    AND assigned_to = auth.uid()
  );
CREATE POLICY "workers_update_assigned" ON complaints
  FOR UPDATE USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());
CREATE POLICY "supervisors_see_area" ON complaints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('supervisor', 'officer', 'admin'))
  );
CREATE POLICY "supervisors_update_complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('supervisor', 'officer', 'admin'))
  );

-- workers table
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workers_own_row" ON workers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "supervisors_see_workers" ON workers FOR SELECT USING (
  EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
);

-- work_proof
ALTER TABLE work_proof ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workers_own_proof" ON work_proof FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "workers_insert_proof" ON work_proof FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "officers_verify_proof" ON work_proof FOR SELECT USING (
  EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('officer', 'supervisor', 'admin'))
);
CREATE POLICY "officers_update_proof" ON work_proof FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('officer', 'supervisor', 'admin'))
);

-- audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins_all_logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin')
);

-- public read tables
ALTER TABLE authorities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_authorities" ON authorities FOR SELECT USING (true);
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_wards" ON wards FOR SELECT USING (true);

-- reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_create_reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
```

## 3.4 Auth Flow

```
User enters phone → Supabase OTP → User enters OTP →
JWT in httpOnly cookie → Middleware refreshes session →
Check role in users_profile → Redirect:
  citizen    → /dashboard
  worker     → /worker
  supervisor → /supervisor
  officer    → /supervisor/verify
  admin      → /admin
```

## 3.5 Deployment

| Component | Platform |
|-----------|----------|
| Frontend + API Routes | Vercel |
| Database + Auth + Storage | Supabase (free tier) |

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

## 3.6 Version Control

```
main          → Production-ready
dev           → Active development
feature/*     → Per feature
fix/*         → Bug fixes

Commit format:
feat: add worker proof submission
fix: handle proof image upload failure
schema: add work_proof table
seed: add demo workers for Bangalore
```
