-- Migration: Add model_id column to threads table
-- Run this on existing databases to add model support

ALTER TABLE threads 
ADD COLUMN IF NOT EXISTS model_id TEXT NOT NULL DEFAULT 'gpt-4o';

-- Update existing threads to use gpt-4o as default
UPDATE threads SET model_id = 'gpt-4o' WHERE model_id IS NULL;
