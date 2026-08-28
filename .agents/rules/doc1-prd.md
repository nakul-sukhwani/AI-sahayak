# DOC 1: PRD — NAGRIK SEVA

## 1. Product Identity

**Name:** Nagrik Seva
**Type:** AI-powered civic complaint filing and resolution tracking platform
**Target Users:** Indian citizens, field workers, supervisors, officers
**Core Problem:** Existing government complaint portals have poor UX, no AI, no image analysis, no smart routing, and no closed-loop resolution tracking with proof of work
**Core Value:** Multimodal AI classifies complaints, suggests assignments, verifies proof-of-work photos — humans make final decisions at every checkpoint

## 2. Core User Flow

### Citizen Flow
```
OTP Login → Capture Photo → AI Analyzes Image →
Confirm Classification → Pin Location → View Authority → Generate PDF → Download
```

### Resolution Flow
```
AI suggests department + worker → Supervisor confirms assignment →
Worker receives task → Worker completes work → Worker submits proof photo →
AI verifies proof (before vs after) → Officer confirms/rejects →
Citizen notified with before/after photos
```

## 3. User Roles

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| Citizen | File complaints, view own complaints, download PDFs, see resolution proof | Assign work, verify proof, access worker views |
| Worker | View assigned tasks, start work, submit proof photos | File complaints, assign work, verify proof |
| Supervisor | View unassigned complaints, assign workers, see AI suggestions | Submit proof, file complaints as citizen |
| Officer | View AI-verified proofs, approve/reject, final status update | Assign workers, submit proof |
| Admin | All of the above + manage users, view analytics | — |

## 4. Functional Requirements

### 4.1 Authentication
- Mobile number OTP login via Supabase Auth
- Role-based redirect after login:
  - `citizen` → `/dashboard`
  - `worker` → `/worker`
  - `supervisor` → `/supervisor`
  - `officer` → `/supervisor/verify`
- Session management via JWT in httpOnly cookies

### 4.2 Complaint Filing (Citizen)
- Photo capture/upload (max 500KB, EXIF stripped, compressed)
- Optional voice note (browser Web Speech API)
- Optional text description (Hindi/English/regional)
- Map pin selection (Leaflet + OSM Nominatim)
- Anonymous filing option (identity hidden from public, still linked in DB)
- AI returns structured JSON:
```json
{
  "issue_type": "pothole",
  "subcategory": "road_damage",
  "severity": "high",
  "description_en": "Large pothole approximately 2 feet wide...",
  "description_hi": "मुख्य सड़क पर लगभग 2 फीट चौड़ा बड़ा गड्ढा...",
  "suggested_department": "Road Maintenance",
  "suggested_worker_id": null,
  "confidence_score": 0.92,
  "tags": ["road", "pothole", "traffic_hazard"],
  "urgency_reason": "Located on main arterial road with heavy traffic"
}
```
- User edits AI suggestions before submitting
- Complaint saved with status `filed`

### 4.3 AI Classification Pipeline (Gemini 2.5 Flash)
- Input: image URL + optional text/voice + location
- Output: structured JSON (issue_type, severity, descriptions, department, confidence, tags)
- Fallback: if confidence < 0.6, prompt user for text description
- Defensive parsing: strip markdown fences, try/catch JSON.parse, typed fallback

### 4.4 Supervisor Assignment (Human Decision)
- Queue of unassigned complaints with AI suggestion
- Each card shows: original photo, issue type, severity, AI-suggested department, confidence score
- Supervisor can: accept AI suggestion, pick different worker, reject complaint
- Dropdown of available workers filtered by department/area
- On assign: complaint.assigned_to set, worker sees new task

### 4.5 Worker Interface
- Task list filtered by status: pending, in_progress, completed
- Task detail: issue info, map pin, "Navigate" button (opens Google Maps), severity
- "Start Work" button → status changes to `in_progress`
- Proof submission: after-photo (camera capture), optional voice note, optional text notes
- Submit → triggers AI proof verification

### 4.6 AI Proof Verification (Gemini 2.5 Flash)
- Input: before-photo URL + after-photo URL + original issue description + issue type
- Output:
```json
{
  "issue_resolved": true,
  "confidence": 0.94,
  "observation": "Pothole has been filled with asphalt, surface appears level.",
  "remaining_issues": null,
  "new_issues": null
}
```
- Stores result in `work_proof` table
- Does NOT change complaint status — only provides recommendation

### 4.7 Officer Verification (Human Final Call)
- Queue of proofs where AI has analyzed but human hasn't confirmed
- Before/after side-by-side display
- AI verdict overlay: "AI says: Resolved (94% confidence)"
- Three scenarios:
  - AI says resolved + high confidence → quick "Approve"
  - AI says NOT resolved → "Reject" with reason → sends back to worker
  - AI says resolved + LOW confidence → officer actually inspects
- On approve: complaint status → `resolved`, citizen sees proof
- On reject: work_proof.status → `rejected`, worker gets new task notification

### 4.8 Citizen Resolution View
- Complaint detail page shows before/after photos when resolved
- Shows: "Verified by [officer name]" badge
- Shows AI confidence on the verification
- Timeline of: filed → assigned → in_progress → proof submitted → resolved (with timestamps)

### 4.9 PDF Generation
- Formal complaint document with: complaint ID, date, citizen details (masked if anonymous), location, issue classification, severity, AI description, photo, addressed authority, watermark "NAGRIK SEVA — UNOFFICIAL DOCUMENT"
- QR code linking to verification page
- Library: pdf-lib (pure JS)

### 4.10 Complaint Tracker (Citizen Dashboard)
- List of user's complaints with status filters
- Status values: draft, filed, assigned, in_progress, proof_submitted, resolved, rejected
- Click → detail view with timeline, PDF download, proof photos (if resolved)

### 4.11 Authority Routing (Static Data)
- Curated database: `{ward_name, issue_type → authority_name, department, contact}`
- Start with Bangalore/BBMP for MVP
- AI suggests department based on issue_type
- Supervisor uses this to pick the right worker

## 5. Non-Functional Requirements

### 5.1 Performance
- AI classification: < 5 seconds
- AI proof verification: < 5 seconds
- Page load: < 2 seconds
- Image upload: < 3 seconds
- PDF generation: < 2 seconds

### 5.2 Security
- Supabase RLS on all tables, role-based
- Rate limiting on all AI endpoints (5 req/min/user)
- Image validation (MIME + magic bytes, max 500KB)
- EXIF stripping before storage
- No PII in logs
- Signed URLs for images (private bucket)
- No raw errors shown to users

### 5.3 Reliability
- Graceful fallback if Gemini fails → manual form
- Client-side image compression
- Optimistic UI with rollback

## 6. Out of Scope

- RTI assistant
- Automatic submission to government portals
- Duplicate detection (pgvector)
- Face/number plate blur
- WhatsApp bot
- Offline STT
- Custom translation models
- Push notifications (MVP uses in-app status only)
- Public feed (MVP+)

## 7. Success Metrics

- End-to-end complaint filed in < 2 minutes
- AI classification accuracy > 80%
- AI proof verification accuracy > 85%
- Full resolution loop demo in < 60 seconds
- Zero auth/session bugs
- Works on mobile Chrome
