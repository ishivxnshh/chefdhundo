DROP TABLE IF EXISTS resumes;
DROP TABLE IF EXISTS users;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL, -- Clerk user ID from webhook
  name TEXT NOT NULL,
  email TEXT UNIQUE, -- Made nullable to handle cases where email is not available initially
  role TEXT NOT NULL DEFAULT 'basic' CHECK (role IN ('basic', 'pro')),
  chef TEXT NOT NULL DEFAULT 'no' CHECK (chef IN ('yes', 'no')),
  photo TEXT, -- URL to user's profile photo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  user_location TEXT, -- Current job/position location
  age_range TEXT, -- Age range (18-25, 26-35, etc.)
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  city TEXT,
  user_state TEXT,
  pin_code TEXT, -- Changed to TEXT to handle various formats
  experience_years DECIMAL(4,1), -- Changed to DECIMAL to handle values like 1.5
  experiences TEXT, -- experience description as text
  profession TEXT,
  job_role TEXT, -- Job description/responsibilities
  education TEXT,
  cuisines TEXT, -- cuisines as text
  languages TEXT, -- languages as text
  certifications TEXT, -- certifications as text
  current_ctc TEXT, -- Current CTC
  expected_ctc TEXT, -- Expected CTC
  notice_period TEXT, -- Notice period
  training TEXT CHECK (training IN ('yes', 'no', 'try')), -- Changed from BOOLEAN to handle 'try' value
  preferred_location TEXT, -- Preferred job location
  joining TEXT CHECK (joining IN ('immediate', 'specific')),
  work_type TEXT CHECK (work_type IN ('full', 'part', 'contract')), -- Work preference
  business_type TEXT CHECK (business_type IN ('any', 'new', 'old')), -- Business type
  linkedin_profile TEXT, -- LinkedIn URL
  portfolio_website TEXT, -- Portfolio/Website URL
  bio TEXT, -- Bio/Description
  passport TEXT, -- Removed CHECK constraint to handle various passport formats
  photo TEXT, -- URL to profile photo
  resume_file TEXT, -- URL to resume file
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_chef ON users(chef);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_email ON resumes(email);
CREATE INDEX IF NOT EXISTS idx_resumes_city ON resumes(city);
CREATE INDEX IF NOT EXISTS idx_resumes_state ON resumes(user_state);
CREATE INDEX IF NOT EXISTS idx_resumes_profession ON resumes(profession);
CREATE INDEX IF NOT EXISTS idx_resumes_job_role ON resumes(job_role);
CREATE INDEX IF NOT EXISTS idx_resumes_work_type ON resumes(work_type);
CREATE INDEX IF NOT EXISTS idx_resumes_experience ON resumes(experience_years);

-- Create trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for both tables
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at 
  BEFORE UPDATE ON resumes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
-- Allow service role to do everything (for API operations)
CREATE POLICY "Enable all operations for service role" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to insert (for webhooks)
CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = clerk_user_id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = clerk_user_id);

-- Create RLS policies for resumes table
-- Allow service role to do everything (for API operations)
CREATE POLICY "Enable all operations for service role on resumes" ON resumes
  FOR ALL USING (auth.role() = 'service_role');

-- Users can view their own resumes
CREATE POLICY "Users can view own resumes" ON resumes
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
  ));

-- Users can manage their own resumes
CREATE POLICY "Users can manage own resumes" ON resumes
  FOR ALL USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
  ));