-- Keep only the latest resume per user and prevent future duplicates.
-- Run this once in Supabase SQL Editor (or via psql).

BEGIN;

-- Remove older duplicates, keep the newest row per user_id.
WITH ranked_resumes AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC, id DESC
    ) AS rn
  FROM resumes
  WHERE user_id IS NOT NULL
)
DELETE FROM resumes r
USING ranked_resumes rr
WHERE r.id = rr.id
  AND rr.rn > 1;

COMMIT;

-- Enforce one resume per user going forward.
CREATE UNIQUE INDEX IF NOT EXISTS uq_resumes_user_id
  ON resumes(user_id)
  WHERE user_id IS NOT NULL;
