# JobOps AI

Your job search, finally under control.

JobOps AI connects your inbox + calendar, and your job search becomes a clean pipeline with auto-updating status, stored resume versions per application, and interview prep packs.

## Features

- **Automatic Application Tracking**: Connect Gmail and automatically track job applications from emails
- **Pipeline Management**: Visual kanban board to manage your job search pipeline
- **Resume Versioning**: Generate tailored resume versions for each application
- **Interview Prep Packs**: Automatically generated interview preparation materials
- **Chrome Extension**: Save job postings directly from job boards
- **Smart Reminders**: Never miss a follow-up or interview

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4
- **Chrome Extension**: Manifest V3

## Setup

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key
- Gmail OAuth credentials (for email integration)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (copy `.env.local.example` to `.env.local`):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   GMAIL_CLIENT_ID=your_gmail_client_id
   GMAIL_CLIENT_SECRET=your_gmail_client_secret
   GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the migration: `supabase/migrations/001_initial_schema.sql`
   - Create a storage bucket named `resumes` with public access

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Chrome Extension Setup

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome-extension` folder
4. Configure the API URL in the extension popup

## Database Schema

The application uses the following main tables:
- `profiles` - User profiles
- `applications` - Job applications
- `emails` - Email tracking
- `resume_versions` - Tailored resume versions
- `interview_packs` - Interview preparation materials
- `events` - Follow-ups and reminders
- `integrations` - Gmail/calendar connections

See `supabase/migrations/001_initial_schema.sql` for the full schema.

## Key Features Implementation

### Email Ingestion
- Gmail OAuth integration
- Automatic email classification
- Application creation/updates from emails
- Status mapping based on email content

### Resume Engine
- Master resume upload
- LLM-powered tailoring
- DOCX/PDF generation
- Version tracking per application

### Interview Packs
- Automatic generation when stage changes to "interview"
- Role-specific questions
- Behavioral STAR prompts
- 30/60/90-day plans

## Privacy & Security

- Read-only email access
- Encrypted token storage
- No auto-applications
- User data deletion on account removal
- Row-level security (RLS) on all tables

## License

MIT
