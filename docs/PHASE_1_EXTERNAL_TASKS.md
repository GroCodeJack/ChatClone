# Phase 1 External Tasks

This document lists everything you need to do **outside this repository** to complete Phase 1 setup.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Project Name**: `ChatClone` (or whatever you prefer)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the closest region to you
4. Click **"Create new project"** and wait for it to provision (~2 minutes)

---

## 2. Get Your Supabase API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Publishable key** (starts with `sb_publishable_...`)
   - **Secret key** (starts with `sb_secret_...` - keep this secret!)

**Important:** Use the new `sb_publishable_...` and `sb_secret_...` keys, NOT the old `anon` or `service_role` JWT keys. The new keys are more secure and easier to rotate.

---

## 3. Create `.env.local` File

In `/Users/jackgrothaus/misc-coding/ChatClone/web/`, create a file named `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL_HERE]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[YOUR_PUBLISHABLE_KEY_HERE]
SUPABASE_SECRET_KEY=[YOUR_SECRET_KEY_HERE]
```

Replace the `[YOUR_..._HERE]` placeholders with the actual keys you copied in step 2.

**Tip:** There's a template file at `/web/ENV_TEMPLATE.txt` you can copy and rename to `.env.local`.

---

## 4. Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `/web/src/lib/db/schema.sql` from this repo
4. Paste it into the SQL editor
5. Click **"Run"** to execute the schema
6. Verify that the `threads` and `messages` tables were created by going to **Table Editor**

---

## 5. Enable Authentication Providers

### Email Authentication
1. Go to **Authentication** → **Providers**
2. Find **Email** and ensure it's enabled (it should be by default)
3. Under **Email Auth**, make sure:
   - ✅ "Enable email provider" is checked
   - ✅ "Confirm email" can be enabled or disabled based on your preference (disable for faster testing)

### Google OAuth
1. Still in **Authentication** → **Providers**, find **Google**
2. Click **"Enable"**
3. You'll need to create a Google OAuth app:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use existing)
   - Enable **Google+ API**
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Set **Application type** to "Web application"
   - Add authorized redirect URI: `https://xxxxx.supabase.co/auth/v1/callback` (replace with your Supabase project URL)
   - Copy the **Client ID** and **Client Secret**
4. Back in Supabase, paste your Google **Client ID** and **Client Secret**
5. Click **"Save"**

---

## 6. Configure Redirect URLs

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth/callback
   ```
3. If you deploy to production later, also add your production callback URL (e.g., `https://yourdomain.com/auth/callback`)
4. Click **"Save"**

---

## 7. Test the Application

1. In your terminal, navigate to `/Users/jackgrothaus/misc-coding/ChatClone/web`
2. Run:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser
4. You should see the Phase 1 setup checklist page

---

## 8. Verify Everything Works

Once the dev server is running:
- The page should load without errors
- Check the browser console for any missing environment variable errors
- If you see errors about missing env vars, double-check your `.env.local` file

---

## Summary of What You Created

✅ Supabase project with Postgres database  
✅ `threads` and `messages` tables with RLS policies  
✅ Email + Google OAuth providers enabled  
✅ Redirect URLs configured  
✅ Local `.env.local` file with API keys  

---

## Next Steps

Phase 1 is complete once:
- The dev server runs without errors
- You can access `http://localhost:3000`
- The Supabase client can connect (no console errors about missing keys)

**Phase 2** will add the actual chat UI with Assistant-UI components and thread management.
