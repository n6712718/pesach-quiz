-- =============================================
-- Pesach Quiz - Supabase Schema
-- ישיבת בני עקיבא עלי
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PARTICIPANTS TABLE
-- =============================================
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  total_points INTEGER DEFAULT 0 NOT NULL,
  streak INTEGER DEFAULT 0 NOT NULL,
  last_quiz_day INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- QUIZ COMPLETIONS TABLE
-- =============================================
CREATE TABLE quiz_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 20),
  score INTEGER NOT NULL DEFAULT 0,
  answers JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, day_number)
);

-- =============================================
-- LOTTERIES TABLE
-- =============================================
CREATE TABLE lotteries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('regular', 'grand')),
  winner_id UUID REFERENCES participants(id),
  winner_name TEXT NOT NULL,
  winner_class TEXT NOT NULL,
  description TEXT DEFAULT '',
  held_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_participants_points ON participants(total_points DESC);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_completions_participant ON quiz_completions(participant_id);
CREATE INDEX idx_completions_day ON quiz_completions(day_number);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotteries ENABLE ROW LEVEL SECURITY;

-- Participants: everyone can read (for leaderboard), anyone can insert (register)
CREATE POLICY "participants_select" ON participants FOR SELECT USING (true);
CREATE POLICY "participants_insert" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_update" ON participants FOR UPDATE USING (true);

-- Quiz completions: anyone can read/insert
CREATE POLICY "completions_select" ON quiz_completions FOR SELECT USING (true);
CREATE POLICY "completions_insert" ON quiz_completions FOR INSERT WITH CHECK (true);

-- Lotteries: everyone can read, anyone can insert (admin handles this)
CREATE POLICY "lotteries_select" ON lotteries FOR SELECT USING (true);
CREATE POLICY "lotteries_insert" ON lotteries FOR INSERT WITH CHECK (true);

-- =============================================
-- CHALLENGE COMPLETIONS TABLE
-- =============================================
CREATE TABLE challenge_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 20),
  score INTEGER NOT NULL DEFAULT 0,
  answers JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, day_number)
);

CREATE INDEX idx_challenge_completions_participant ON challenge_completions(participant_id);

CREATE POLICY "challenge_completions_select" ON challenge_completions FOR SELECT USING (true);
CREATE POLICY "challenge_completions_insert" ON challenge_completions FOR INSERT WITH CHECK (true);
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- REALTIME (enable for leaderboard)
-- =============================================
-- Run in Supabase Dashboard > Database > Replication:
-- Enable realtime for "participants" table

-- =============================================
-- LEADERBOARD VIEW (optional, for convenience)
-- =============================================
CREATE VIEW leaderboard_view AS
SELECT
  p.id,
  p.name,
  p.class,
  p.total_points,
  p.streak,
  p.last_quiz_day,
  COUNT(qc.id) AS quizzes_completed,
  ROW_NUMBER() OVER (ORDER BY p.total_points DESC) AS rank
FROM participants p
LEFT JOIN quiz_completions qc ON qc.participant_id = p.id
GROUP BY p.id, p.name, p.class, p.total_points, p.streak, p.last_quiz_day
ORDER BY p.total_points DESC;
