# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

## 2. Run Database Migration

1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run it in the SQL Editor

## 3. Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `resumes`
3. Set it to **Public** (or configure RLS policies if you prefer private)
4. Enable file uploads

## 4. Configure Environment Variables

Add these to your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 5. Gmail OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/gmail/callback`
6. Add credentials to `.env.local`:

```
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
```

## 6. OpenAI Setup

1. Get API key from [OpenAI](https://platform.openai.com)
2. Add to `.env.local`:

```
OPENAI_API_KEY=your_openai_api_key
```

## Verification

After setup, you should be able to:
- Sign up/login
- Upload a master resume
- Connect Gmail (if configured)
- Create applications
- Generate tailored resumes
- Generate interview packs
