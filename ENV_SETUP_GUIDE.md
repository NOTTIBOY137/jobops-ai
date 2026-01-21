# Environment Variables Setup Guide

## Step 1: Get Supabase Keys

From your Supabase API Settings page (https://supabase.com/dashboard/project/fmvsptyxqwfbovjldnkp/settings/api):

1. **Project URL**: `https://fmvsptyxqwfbovjldnkp.supabase.co` (already found)

2. **anon/public key**: 
   - Look for a section labeled "Project API keys" or "anon public"
   - Click the "Reveal" or "Copy" button next to it
   - It starts with `eyJ...` (a long JWT token)

3. **service_role key**:
   - Look for "service_role" key (usually below the anon key)
   - Click "Reveal" to show it
   - **WARNING**: This key has admin access - keep it secret!

## Step 2: Add to Vercel

Go to: https://vercel.com/nottiboy137s-projects/jobops-ai/settings/environment-variables

Add these variables:

### Required Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://fmvsptyxqwfbovjldnkp.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: (your anon key from Supabase)

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: (your service_role key from Supabase)

4. **OPENAI_API_KEY**
   - Value: (your OpenAI API key from https://platform.openai.com/api-keys)

5. **ENCRYPTION_KEY**
   - Generate a random 32-character string
   - You can use: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`

### Optional (for Gmail integration):

6. **GMAIL_CLIENT_ID**
7. **GMAIL_CLIENT_SECRET**
8. **GMAIL_REDIRECT_URI** (set after first deployment)
9. **NEXT_PUBLIC_APP_URL** (set after first deployment)

## Step 3: Redeploy

After adding variables, Vercel will automatically redeploy or you can manually trigger a redeploy.
