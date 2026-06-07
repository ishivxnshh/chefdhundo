import { ensureUserForPhone, syntheticIdToPhone } from "@/lib/auth/server";
import { supabaseAdmin } from "./supabase";
import type { User } from "@/types/supabase";

export async function getServerUser(identityId: string): Promise<User | null> {
  const phone = syntheticIdToPhone(identityId);
  if (phone) return ensureUserForPhone(phone);

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("clerk_user_id", identityId)
    .maybeSingle();
  if (error) {
    console.error("Server user lookup failed:", error.message);
    return null;
  }
  return data;
}

export async function getOrCreateServerUser(user: {
  id: string;
  primaryPhoneNumber?: { phoneNumber: string } | null;
}): Promise<User | null> {
  const phone =
    user.primaryPhoneNumber?.phoneNumber || syntheticIdToPhone(user.id);
  if (!phone) return getServerUser(user.id);
  return ensureUserForPhone(phone);
}
