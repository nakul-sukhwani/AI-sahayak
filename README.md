# Nagrik Seva — AI-Powered Civic Complaint Platform

Nagrik Seva is a closed-loop civic complaint platform built to streamline and bring accountability to municipal problem-solving in India.

By leveraging **Gemini AI**, the platform instantly categorizes complaints based on photos, automatically routes them to the correct municipal department, and independently verifies "proof of work" photos submitted by field workers before a complaint is marked as resolved.

## 🚀 Features

- **OTP Authentication**: Secure, passwordless login via Supabase.
- **AI Classification**: Upload a photo of a civic issue (e.g., pothole, broken streetlight, garbage dump). Gemini analyzes the image, determines the severity, and writes a bilingual description (English + Hindi).
- **Smart Routing**: The AI suggests the correct municipal department (e.g., Solid Waste Management, Roads & Infrastructure) based on the image analysis.
- **Multimodal Input**: Voice-to-text descriptions (en-IN) and GPS pin drops.
- **Multi-Role Workflows**:
  - **Citizens**: File complaints, track status on a timeline, and download official PDF records.
  - **Supervisors**: View AI-routed complaints and dispatch them to available field workers.
  - **Field Workers**: See assigned tasks, navigate to locations, and submit completion photos (proof of work).
  - **Verification Officers**: Review side-by-side before/after photos along with the AI's verification verdict to approve or reject the work.
- **AI Verification**: Gemini compares the original complaint photo against the worker's completion photo to confirm the issue was actually fixed.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Styling**: Tailwind CSS (Mobile-first, Custom tokens from Figma)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, OTP Auth, Storage Buckets)
- **AI**: Google Gemini (via `@google/genai`)
- **PDF Generation**: `pdf-lib`
- **Maps**: Leaflet + OpenStreetMap (Nominatim for reverse geocoding)

## 📦 Setup & Installation

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and add your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. **Database Setup**: Run the SQL migrations found in the documentation to set up tables, RLS policies, and seed data.
5. **Run the development server**: `npm run dev`

Open [https://ai-sahayak.vercel.app](https://ai-sahayak.vercel.app) to view the application.
