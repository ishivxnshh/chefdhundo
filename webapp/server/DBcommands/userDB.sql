BEGIN;

-- put the role column back to basic/pro only
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check,
  ADD  CONSTRAINT users_role_check CHECK (role IN ('basic', 'pro'));

-- allow admin on the chef flag instead
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_chef_check,
  ADD  CONSTRAINT users_chef_check CHECK (chef IN ('yes', 'no', 'admin'));

COMMIT;