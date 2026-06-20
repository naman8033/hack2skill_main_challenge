-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    target_exam VARCHAR(50) NOT NULL, -- 'NEET', 'JEE', 'UPSC', 'CAT', 'GATE', 'CUET'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood_score INT CHECK (mood_score BETWEEN 1 AND 5) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mood Records Table (For separate mood checks)
CREATE TABLE IF NOT EXISTS mood_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood_score INT CHECK (mood_score BETWEEN 1 AND 5) NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stress Triggers Table
CREATE TABLE IF NOT EXISTS stress_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    journal_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- e.g., 'Syllabus Backlog', 'Exam Anxiety', 'Parental Pressure'
    intensity_score INT CHECK (intensity_score BETWEEN 1 AND 10) NOT NULL,
    evidence_snippet TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coping Strategies Table
CREATE TABLE IF NOT EXISTS coping_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    journal_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    strategy_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(50) CHECK (sender IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mock Test Records Table
CREATE TABLE IF NOT EXISTS mock_test_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    max_score INT NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    mistakes_summary TEXT,
    calmed_after_exercise BOOLEAN DEFAULT FALSE,
    reframed_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_user_date ON mood_records(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_triggers_user ON stress_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_coping_user ON coping_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_user ON mock_test_records(user_id);

-- Insert a default user to ensure APIs work out of the box without registration
INSERT INTO users (id, email, full_name, target_exam)
VALUES ('00000000-0000-0000-0000-000000000000', 'default.student@mindmirror.ai', 'Default Student', 'JEE')
ON CONFLICT (id) DO NOTHING;

