-- =====================================================
-- ANNOUNCEMENTS TABLE FOR ADMIN-MANAGED SITE-WIDE NOTIFICATIONS
-- =====================================================
-- Run this SQL in your Supabase SQL Editor Dashboard
-- This creates a new table for managing announcements
-- =====================================================

-- Drop existing table if needed (BE CAREFUL!)
-- DROP TABLE IF EXISTS announcements;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Core content
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'promo', 'success', 'error', 'new', 'update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL, -- Supports markdown formatting
  tag TEXT, -- Optional badge text (e.g., "NEW", "BETA")
  icon TEXT, -- Lucide icon name (e.g., "Sparkles", "Info")
  
  -- Links
  link_url TEXT, -- Optional external link
  link_text TEXT, -- Link button text
  
  -- Status and scheduling
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'scheduled', 'expired', 'draft')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ, -- NULL = no expiry
  
  -- Display options
  dismissible BOOLEAN NOT NULL DEFAULT TRUE,
  themed BOOLEAN NOT NULL DEFAULT FALSE,
  bg_color TEXT, -- Tailwind CSS class (e.g., "bg-purple-50")
  text_color TEXT, -- Tailwind CSS class (e.g., "text-purple-900")
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_start_date ON announcements(start_date);
CREATE INDEX IF NOT EXISTS idx_announcements_end_date ON announcements(end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_active_range ON announcements(status, start_date, end_date);

-- Create trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_announcements_timestamp 
  BEFORE UPDATE ON announcements 
  FOR EACH ROW 
  EXECUTE FUNCTION update_announcements_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow service role to do everything (for API operations)
CREATE POLICY "Enable all operations for service role" ON announcements
  FOR ALL USING (auth.role() = 'service_role');

-- Allow public read access to active announcements only
CREATE POLICY "Public can view active announcements" ON announcements
  FOR SELECT USING (
    status = 'active' 
    AND start_date <= NOW() 
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Optional: Allow authenticated users to view all announcements
-- Uncomment if you want logged-in users to see scheduled/draft announcements
-- CREATE POLICY "Authenticated users can view all announcements" ON announcements
--   FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================
-- Run this to insert some sample announcements for testing

INSERT INTO announcements (type, title, message, tag, icon, status, priority, link_url, link_text, dismissible, themed, bg_color, text_color)
VALUES 
  (
    'new',
    'New Feature Launch! 🎉',
    'Check out our **brand new admin dashboard** with powerful analytics and management tools!',
    'NEW',
    'Sparkles',
    'active',
    10,
    'https://chefdhundo.com/admin',
    'Explore Now',
    true,
    false,
    'bg-indigo-50',
    'text-indigo-900'
  ),
  (
    'promo',
    'Limited Time Offer',
    'Get **50% off** on Pro membership this week only. Upgrade now!',
    'OFFER',
    'Sparkles',
    'active',
    9,
    'https://chefdhundo.com/upgrade',
    'Upgrade Now',
    true,
    true,
    'bg-purple-50',
    'text-purple-900'
  ),
  (
    'info',
    'Platform Maintenance',
    'Scheduled maintenance on **Nov 30, 2025** from 2 AM - 4 AM IST. Services may be briefly unavailable.',
    NULL,
    'Info',
    'scheduled',
    7,
    NULL,
    NULL,
    false,
    false,
    'bg-blue-50',
    'text-blue-900'
  );

-- =====================================================
-- VERIFY INSTALLATION
-- =====================================================
-- Run this query to check if everything is set up correctly

SELECT 
  COUNT(*) as total_announcements,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_count,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_count
FROM announcements;

-- =====================================================
-- NOTES FOR ADMIN
-- =====================================================
-- 1. After running this SQL, refresh your TypeScript types:
--    - If using Supabase CLI: `supabase gen types typescript`
--    - Or manually update your src/types/supabase.ts
--
-- 2. The API routes will work automatically once the table exists
--
-- 3. To update TypeScript types, add this to your supabase.ts:
--    Add 'announcements' to the Database['public']['Tables'] interface
--
-- 4. Test the feature:
--    - Go to /admin (as admin user)
--    - Create a new announcement
--    - Set status to 'active'
--    - Visit your homepage to see it displayed
--
-- 5. Announcements are:
--    - Automatically scheduled based on start_date/end_date
--    - Dismissible per-user via localStorage
--    - Sorted by priority (higher = shown first)
--    - Filtered to show only active ones within date range
-- =====================================================
