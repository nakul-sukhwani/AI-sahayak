# DOC 6: SECURITY FEATURES — NAGRIK SEVA

## 1. Identity Protection

### 1.1 Phone Number Masking
- Display: `+91 ****5678` everywhere except user's own profile
- Reveal requires re-OTP verification
- PDF: `Phone: +91 ****5678 (verified)`

### 1.2 Anonymous Complaint Option
- Toggle on filing form: "File anonymously"
- When enabled: name → "Anonymous Citizen", phone omitted from PDF, excluded from public feed
- Still linked to user_id in DB (abuse prevention)
- Default: OFF

### 1.3 Display Name
- Separate from Full Name
- Used on public-facing elements
- Full Name only in PDF documents to authorities

## 2. Complaint Privacy

### 2.1 Visibility Setting
- `private` (default): only complainant
- `public`: on public feed, location blurred, identity masked
- `shared`: via shareable link only

### 2.2 Location Blurring (Public Complaints)
- Exact pin offset by 50-200m random direction on public feed
- PDF uses exact coordinates
- Blur is deterministic from complaint ID (consistent)

### 2.3 EXIF Stripping
- All metadata removed before upload
- Prevents accidental location/device leakage
- Library: `exifr`

## 3. Session Management

### 3.1 Active Sessions
- "My Sessions" in profile: device, last active, city
- Terminate other sessions
- Stored in `user_sessions` table (full version)

### 3.2 Forced Logout
- "Log out all devices" button
- Deletes all sessions, invalidates all JWTs

### 3.3 Login Notifications
- MVP: logged in audit_logs only
- Full version: SMS notification on new session

## 4. Data Rights

### 4.1 Download My Data
- "Export My Data" → JSON file with profile, complaints, audit logs
- Excludes tokens and internal system data

### 4.2 Delete My Account
- Requires re-OTP
- Soft-delete → anonymize complaints → hard-delete after 30 days
- Revoke all sessions immediately

### 4.3 Delete Individual Complaint
- "Delete Complaint" → confirmation modal
- Removes image from storage, soft-deletes row
- Logged in audit_logs

## 5. Abuse Prevention

### 5.1 Complaint Reporting
- "Report" button on public feed
- Reasons: Spam, Inappropriate image, False information, PII exposed
- Stored in `reports` table
- MVP: logged only. Full version: admin review

### 5.2 Upload Rate Warning
- >5 uploads in 10 minutes → friction warning
- Not a block — just a check

### 5.3 Duplicate Complaint Warning
- Check user's last 10 complaints for same issue_type + ward within 7 days
- Warning: "You filed a similar complaint on [date]. Continue?"
- Not a block

## 6. Worker-Specific Security Features

### 6.1 Assignment Confirmation
- Worker receives assignment → must tap "Acknowledge" within 2 hours
- If not acknowledged → supervisor notified, assignment marked "unacknowledged"
- Prevents ghost assignments

### 6.2 Proof Photo Validation
- After-photo must be taken after "Start Work" timestamp
- Minimum resolution: 640x480 (prevents blank/tiny images)
- If photo doesn't meet criteria → reject upload with reason

### 6.3 Tamper Detection
- Proof photo EXIF timestamp compared to submission time
- If timestamp is >24 hours before submission → flag for supervisor review
- Catches "reusing old photos" as proof

### 6.4 Worker Activity Log
- Worker can see their own action history: assignments received, tasks started, proofs submitted, rejections received
- Builds accountability without being punitive

### 6.5 Supervisor Verification Accountability
- Every approve/reject is logged with officer name and timestamp
- "Verified by [officer name]" shown to citizen
- Officer cannot anonymously approve/reject

## 7. PDF Security Features

### 7.1 Watermark
- Diagonal: "NAGRIK SEVA — UNOFFICIAL DOCUMENT"
- Prevents confusion with government documents

### 7.2 QR Code
- Contains complaint ID + verification URL
- Scan → verification page shows: ID, date, status, "Nagrik Seva generated"
- Library: `qrcode`

### 7.3 Tamper Evidence
- PDF metadata: generation timestamp, complaint ID hash, AI confidence
- Verification endpoint checks metadata vs DB

## 8. Visible Security Indicators

- Next to OTP login: "🔒 Phone verified via OTP"
- Next to filed complaint: "✓ AI analyzed — 92% confidence"
- Next to resolved complaint: "✅ Verified by [officer name]"
- On proof: "🤖 AI verified — 94% confidence" + "✅ Officer confirmed"
- On profile: "✓ Account verified"

## 9. Privacy Policy Page

- `/privacy` route, static page, <500 words
- Covers: data collected, how used, storage duration, deletion rights, complaints not auto-filed with government
- Plain language, no legal jargon

## 10. Feature Priority

| Feature | Phase | Effort |
|---------|-------|--------|
| Phone masking | MVP | 1 hr |
| EXIF stripping | MVP | 1 hr |
| PDF watermark | MVP | 30 min |
| Anonymous toggle | MVP | 2 hrs |
| Privacy policy | MVP | 1 hr |
| Assignment acknowledgment | Worker phase | 2 hrs |
| Proof photo validation | Worker phase | 1 hr |
| Tamper detection | Worker phase | 2 hrs |
| Worker activity log | Worker phase | 2 hrs |
| Verification accountability | Worker phase | 1 hr |
| Visibility settings | Full | 3 hrs |
| Location blurring | Full | 4 hrs |
| Session management | Full | 1 day |
| Download my data | Full | 4 hrs |
| Delete account | Full | 4 hrs |
| Complaint reporting | Full | 3 hrs |
| QR code on PDF | Full | 2 hrs |
| Login notification SMS | Full | 2 hrs |
| Duplicate warning | Full | 2 hrs |
