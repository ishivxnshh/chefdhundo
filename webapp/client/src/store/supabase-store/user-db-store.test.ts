import { describe, expect, it } from 'vitest'
import { hasFetchedCurrentUserForIdentity } from './user-db-store'
import type { User } from '@/types/supabase'

const identityId = 'phone:+918104109962'

function mobileUser(): User {
  return {
    id: 'user-id',
    clerk_user_id: identityId,
    name: '+918104109962',
    email: null,
    role: 'basic',
    chef: 'no',
    photo: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

describe('hasFetchedCurrentUserForIdentity', () => {
  it('does not treat a cached null user as a completed mobile profile load', () => {
    expect(
      hasFetchedCurrentUserForIdentity(
        {
          lastFetchedIdentityId: identityId,
          isUserLoaded: true,
          currentUser: null,
        },
        identityId
      )
    ).toBe(false)
  })

  it('allows skipping only when the current user is present for that identity', () => {
    expect(
      hasFetchedCurrentUserForIdentity(
        {
          lastFetchedIdentityId: identityId,
          isUserLoaded: true,
          currentUser: mobileUser(),
        },
        identityId
      )
    ).toBe(true)
  })
})
