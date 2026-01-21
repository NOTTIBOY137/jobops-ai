# Deployment Guide for JobOps AI

## Vercel Deployment

### Step 1: Environment Variables

Add these environment variables in your Vercel project settings:

1. Go to your project → Settings → Environment Variables
2. Add the following variables:

#### Required Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
ENCRYPTION_KEY=your_32_character_random_string
```

#### Optional (for Gmail integration):

```
GMAIL_CLIENT_ID=your_gmail_oauth_client_id
GMAIL_CLIENT_SECRET=your_gmail_oauth_client_secret
GMAIL_REDIRECT_URI=https://your-app.vercel.app/api/auth/gmail/callback
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 2: Generate Encryption Key

Generate a secure 32-character encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Use this as your `ENCRYPTION_KEY` value.

### Step 3: Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run the migration from `supabase/migrations/001_initial_schema.sql`
3. Create a storage bucket named `resumes` (public access)
4. Copy your project URL and keys to Vercel environment variables

### Step 4: Deploy

1. Push your code to GitHub
2. Vercel will automatically deploy
3. After first deployment, update `GMAIL_REDIRECT_URI` and `NEXT_PUBLIC_APP_URL` with your actual Vercel URL

### Step 5: Verify Deployment

- Check build logs for any errors
- Visit your deployed URL
- Test authentication
- Verify Supabase connection

## Troubleshooting

### Build Errors

- **TypeScript errors**: Run `npm run build` locally first
- **Missing dependencies**: Check `package.json` is committed
- **Environment variables**: Ensure all required vars are set

### Runtime Errors

- **Supabase connection**: Verify URLs and keys are correct
- **CORS issues**: Check Supabase RLS policies
- **Storage errors**: Ensure `resumes` bucket exists and is public

## Post-Deployment

1. Update Gmail OAuth redirect URI in Google Cloud Console
2. Test email sync functionality
3. Verify resume uploads work
4. Check interview pack generation
