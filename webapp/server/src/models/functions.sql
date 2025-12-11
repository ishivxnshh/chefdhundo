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




---------------------------------------------- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes', 
  'resumes', 
  false, 
  10485760, -- 10MB
  ARRAY['application/pdf']::text[]
);

-- Create policies
CREATE POLICY "Service role can upload resumes"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Service role can read resumes"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'resumes');

CREATE POLICY "Service role can delete resumes"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'resumes');



------------------------------------- 1. Create the function to handle expiration
CREATE OR REPLACE FUNCTION handle_expired_subscriptions()
RETURNS void AS $$
BEGIN
  -- A. Mark subscriptions as EXPIRED if they are past their end_date
  UPDATE subscriptions
  SET status = 'EXPIRED'
  WHERE status = 'ACTIVE' AND end_date < NOW();

  -- B. Downgrade users to 'basic' if they have NO active subscriptions
  UPDATE users
  SET role = 'basic'
  WHERE role = 'pro' 
  AND id NOT IN (
    SELECT user_id 
    FROM subscriptions 
    WHERE status = 'ACTIVE'
    AND end_date > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Schedule the job to run every hour
-- Note: You need to enable the pg_cron extension first
SELECT cron.schedule('check-subscriptions', '0 * * * *', $$SELECT handle_expired_subscriptions()$$);