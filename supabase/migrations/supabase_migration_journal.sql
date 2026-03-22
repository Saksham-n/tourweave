-- Create travel_journal_entries table
CREATE TABLE IF NOT EXISTS travel_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sentiment_score DECIMAL(3,2),
  sentiment_label VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_journal_user_id ON travel_journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_created_at ON travel_journal_entries(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE travel_journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own entries
CREATE POLICY "Users can view own journal entries" ON travel_journal_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own entries
CREATE POLICY "Users can create own journal entries" ON travel_journal_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own entries
CREATE POLICY "Users can update own journal entries" ON travel_journal_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own entries
CREATE POLICY "Users can delete own journal entries" ON travel_journal_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_journal_updated_at_trigger ON travel_journal_entries;
CREATE TRIGGER update_journal_updated_at_trigger
BEFORE UPDATE ON travel_journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_journal_updated_at();
