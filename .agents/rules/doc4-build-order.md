# DOC 4: BUILD ORDER

## Phase 0: Project Scaffolding (1-5)

```
1. Initialize Next.js with TypeScript + Tailwind
2. Install all dependencies
3. Create .env.example
4. Create folder structure (all empty files with exports)
5. Create type definitions (types/*.ts including work-proof.ts)
```

## Phase 1: Database & Auth (6-13)

```
6.  Create Supabase client files (client.ts, server.ts, middleware.ts)
7.  Migration 001: users_profile (with role column)
8.  Migration 002: authorities
9.  Migration 003: wards
10. Migration 004: complaints (with assignment + privacy fields)
11. Migration 005: audit_logs
12. Migration 006: workers
13. Migration 007: work_proof + RLS policies
```

## Phase 2: Seed Data (14-15)

```
14. Seed: bangalore_authorities.sql
15. Seed: demo_workers.sql (3 workers, 1 supervisor, 1 officer)
```

## Phase 3: Auth UI (16-19)

```
16. SupabaseProvider
17. useAuth hook (returns user + role)
18. OTPForm component
19. /login page with role-based redirect
```

## Phase 4: Core UI Primitives (20-26)

```
20. Button
21. Input
22. Card
23. Badge
24. Spinner
25. Modal
26. Toast
```

## Phase 5: Layout (27-30)

```
27. Navbar (role-aware: different links per role)
28. MobileNav
29. Dashboard layout (protected)
30. Root layout (fonts, providers, metadata)
```

## Phase 6: Complaint Filing — Photo (31-34)

```
31. image.ts (compression + EXIF stripping)
32. PhotoCapture component
33. Supabase Storage bucket setup (private: complaints)
34. API route: /api/upload-image
```

## Phase 7: Complaint Filing — AI Analysis (35-38)

```
35. prompts/analyze-complaint.ts
36. gemini.ts client (analyzeComplaint function)
37. rate-limit.ts
38. API route: /api/analyze
```

## Phase 8: Complaint Filing — Location (39-41)

```
39. useGeolocation hook
40. MapPicker component
41. constants/authorities.ts
```

## Phase 9: Complaint Filing — Form & Submit (42-46)

```
42. VoiceInput component
43. AIResultCard component
44. AuthoritySuggestion component
45. ComplaintForm component (with anonymous toggle)
46. API route: /api/complaints (POST)
```

## Phase 10: Complaint Filing — Page Assembly (47-48)

```
47. /dashboard/new/page.tsx (multi-step form)
48. constants/issue-types.ts, severities.ts, statuses.ts, roles.ts
```

## Phase 11: PDF Generation (49-51)

```
49. pdf.ts (pdf-lib + watermark + QR code)
50. API route: /api/generate-pdf
51. Download button on complaint detail
```

## Phase 12: Citizen Dashboard (52-55)

```
52. useComplaints hook
53. ComplaintCard component
54. ComplaintTimeline component
55. /dashboard/page.tsx + /dashboard/[id]/page.tsx
```

## Phase 13: Worker Role & Assignment (56-61)

```
56. Worker layout (protected, role check)
57. useWorkerAssignments hook
58. AssignmentCard component
59. /worker/page.tsx (my assignments: pending/in-progress/completed)
60. /worker/[id]/page.tsx (task detail + "Start Work" button)
61. API route: /api/complaints/[id]/start-work (PATCH status)
```

## Phase 14: Proof Submission & AI Verification (62-67)

```
62. ProofSubmission component (after-photo capture + notes)
63. API route: /api/upload-proof-image
64. prompts/verify-proof.ts (before vs after comparison prompt)
65. gemini.ts: add verifyProof function
66. API route: /api/work-proof/submit (stores proof, calls Gemini, stores AI result)
67. Worker task detail: show proof status after submission
```

## Phase 15: Supervisor Dashboard (68-72)

```
68. Supervisor layout (protected, role check)
69. AssignmentQueue component (unassigned complaints with AI suggestion)
70. AssignWorkerModal component (worker dropdown filtered by department)
71. /supervisor/page.tsx (assignment queue)
72. API route: /api/complaints/[id]/assign (PATCH assigned_to, assigned_by, assigned_at)
```

## Phase 16: Officer Verification (73-77)

```
73. BeforeAfterView component (side-by-side with AI verdict overlay)
74. VerificationQueue component (proofs awaiting human verification)
75. /supervisor/verify/page.tsx
76. API route: /api/work-proof/[id]/verify (PATCH status to approved/rejected)
77. Audit log entry for every approve/reject action
```

## Phase 17: Citizen Sees Resolution (78-80)

```
78. /dashboard/[id]/page.tsx: show before/after when resolved
79. ComplaintTimeline: add assigned → in_progress → proof_submitted → resolved entries
80. "Verified by [officer name]" badge on resolved complaints
```

## Phase 18: Polish (81-85)

```
81. Landing page
82. Loading states and error boundaries on all pages
83. Static admin page (/admin) with mock analytics
84. Anonymous complaint toggle
85. Final env var check, .gitignore, README.md
```

**Total: 85 ordered tasks. Agent executes one per response. No skipping. No reordering.**
