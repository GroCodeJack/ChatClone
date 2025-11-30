# Database Migration for Multi-Model Support

## Issue
The error "Cannot read properties of undefined (reading 'id')" occurs because your database doesn't have the `model_id` column yet.

## Solution: Run the Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste this SQL:

```sql
-- Add model_id column to threads table
ALTER TABLE threads 
ADD COLUMN IF NOT EXISTS model_id TEXT NOT NULL DEFAULT 'gpt-4o';

-- Update any existing threads to use gpt-4o as default
UPDATE threads SET model_id = 'gpt-4o' WHERE model_id IS NULL;
```

4. Click **Run** to execute the migration

### Option 2: Via Supabase CLI

If you have the Supabase CLI installed:

```bash
cd /Users/jackgrothaus/misc-coding/ChatClone/web
supabase db push
```

### Option 3: Manual SQL File

The migration file is located at:
```
web/src/lib/db/migrations/add_model_id_to_threads.sql
```

Copy its contents and run in your Supabase SQL Editor.

## Verify Migration

After running the migration, check that the column exists:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'threads' AND column_name = 'model_id';
```

You should see:
```
column_name | data_type | column_default
model_id    | text      | 'gpt-4o'::text
```

## Then Test Again

1. Refresh your app (Cmd+R or reload page)
2. Try clicking "+ New Chat"
3. The error should be gone and you'll see the model picker working!
