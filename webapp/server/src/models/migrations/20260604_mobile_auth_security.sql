-- Staged mobile-auth migration: active code no longer depends on email, but
-- legacy values remain available for rollback during the verification release.
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.resumes ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS claim_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS claim_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_claim_token_hash
  ON public.resumes (claim_token_hash)
  WHERE claim_token_hash IS NOT NULL;

ALTER TABLE public.phone_otps
  ADD COLUMN IF NOT EXISTS request_ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS provider_error TEXT,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_phone_otps_request_ip_created_at
  ON public.phone_otps (request_ip_hash, created_at DESC);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;
