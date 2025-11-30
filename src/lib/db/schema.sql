-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Threads table
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  model_id TEXT NOT NULL DEFAULT 'gpt-4o',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content JSONB NOT NULL,
  model_name TEXT,
  sequence_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_threads_user_id ON threads(user_id);
CREATE INDEX idx_threads_updated_at ON threads(updated_at DESC);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_sequence_index ON messages(thread_id, sequence_index);

-- Row Level Security (RLS)
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for threads
CREATE POLICY "Users can view their own threads"
  ON threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own threads"
  ON threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads"
  ON threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads"
  ON threads FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for messages
CREATE POLICY "Users can view messages in their threads"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
      AND threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their threads"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
      AND threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their threads"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
      AND threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their threads"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
      AND threads.user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update threads.updated_at
CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
