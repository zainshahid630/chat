# Supabase Setup Guide

## Overview

This guide walks you through setting up Supabase for the ChatDesk project.

---

## Prerequisites

- ✅ Supabase CLI installed (`brew install supabase/tap/supabase`)
- ✅ Supabase account (sign up at https://supabase.com)
- ✅ Node.js 21+ installed

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `chatdesk` (or `chatdesk-dev` for development)
   - **Database Password**: Generate a strong password and **SAVE IT**
   - **Region**: Choose closest to you (e.g., `us-east-1`, `eu-west-1`)
   - **Pricing Plan**: Free tier (sufficient for development)
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

---

## Step 2: Get API Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy the following values:

### Required Values:

```
Project URL:          https://xxxxx.supabase.co
Project Reference ID: xxxxx
anon public key:      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key:     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Configure Environment Variables

### For Root Project:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### For Web Dashboard:

1. Copy the example file:
   ```bash
   cp packages/web-dashboard/.env.local.example packages/web-dashboard/.env.local
   ```

2. Fill in the same credentials in `packages/web-dashboard/.env.local`

---

## Step 4: Link Local Project to Supabase

Link your local project to the remote Supabase project:

```bash
supabase link --project-ref xxxxx
```

Enter your database password when prompted.

---

## Step 5: Verify Connection

Test the connection:

```bash
supabase status
```

You should see your project details.

---

## Step 6: Set Up Database Schema

Once linked, you can apply the database schema:

```bash
# Generate migration from schema
supabase db diff --schema public -f initial_schema

# Push to remote database
supabase db push
```

---

## Local Development with Supabase

### Start Local Supabase (Optional)

For local development without using the cloud:

```bash
# Start local Supabase stack (Postgres, Auth, Storage, etc.)
supabase start

# This will output local credentials:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
```

### Stop Local Supabase

```bash
supabase stop
```

---

## Important Files

- **`supabase/config.toml`** - Supabase project configuration
- **`supabase/migrations/`** - Database migration files
- **`supabase/seed.sql`** - Seed data for development
- **`.env.local`** - Environment variables (DO NOT COMMIT)

---

## Security Notes

⚠️ **NEVER commit these files:**
- `.env.local`
- `.env`
- Any file containing `service_role` key

✅ **Safe to commit:**
- `.env.example`
- `supabase/config.toml`
- `supabase/migrations/`

---

## Useful Commands

```bash
# Check Supabase CLI version
supabase --version

# Login to Supabase
supabase login

# Link project
supabase link --project-ref xxxxx

# Check project status
supabase status

# Generate migration
supabase db diff -f migration_name

# Apply migrations
supabase db push

# Reset local database
supabase db reset

# Open Supabase Studio
supabase studio
```

---

## Troubleshooting

### "Project not linked"
```bash
supabase link --project-ref your-project-ref
```

### "Invalid API key"
- Double-check your `.env.local` file
- Make sure you copied the correct keys from the dashboard
- Ensure no extra spaces or quotes

### "Connection refused"
- Check if local Supabase is running: `supabase status`
- Verify your `NEXT_PUBLIC_SUPABASE_URL` is correct

---

## Next Steps

After completing this setup:

1. ✅ Supabase project created
2. ✅ Environment variables configured
3. ✅ Local project linked
4. ⏭️ Create database schema (Phase 1.3)
5. ⏭️ Set up authentication (Phase 1.4)

---

**Last Updated**: 2025-10-31  
**Supabase CLI Version**: 2.54.11

