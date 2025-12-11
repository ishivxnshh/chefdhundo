-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;



-- Only authenticated users can insert (typically from webhook)
CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Admins can do everything (optional - for admin operations)
CREATE POLICY "Enable all operations for service role" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Create resume table for storing chef resumes


-- Create indexes for resumes table

-- Create trigger for resumes updated_at
CREATE TRIGGER update_resumes_updated_at 
  BEFORE UPDATE ON resumes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for resumes
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- RLS policies for resumes


-- Enable all operations for service role
CREATE POLICY "Enable all operations for service role on resumes" ON resumes
  FOR ALL USING (auth.role() = 'service_role');

-- Insert some sample data (optional - remove in production)
-- INSERT INTO users (clerk_user_id, name, email, role, chef) VALUES
-- ('clerk_sample_id_1', 'John Doe', 'john@example.com', 'basic', 'no'),
-- ('clerk_sample_id_2', 'Chef Alice', 'alice@example.com', 'pro', 'yes');
