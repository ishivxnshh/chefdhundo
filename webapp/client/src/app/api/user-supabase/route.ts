import { NextRequest, NextResponse } from "next/server";
import { auth, ensureUserForPhone, syntheticIdToPhone } from "@/lib/auth/server";
import {
  createUser,
  getUserByIdentityId,
  updateUser,
} from "@/lib/supabase/database";
import type { MobileUserData } from "@/types/supabase";

async function authorizeUserTarget(targetIdentityId: string) {
  const { userId } = await auth();
  if (!userId) return { allowed: false, isAdmin: false };
  if (userId === targetIdentityId) return { allowed: true, isAdmin: false };
  const requester = await getUserByIdentityId(userId);
  const isAdmin = requester.success && requester.data?.role === "admin";
  return { allowed: Boolean(isAdmin), isAdmin: Boolean(isAdmin) };
}

export async function GET(request: NextRequest) {
  try {
    const identityId =
      request.nextUrl.searchParams.get("identity_id") ||
      request.nextUrl.searchParams.get("identity_id");
    if (!identityId) {
      return NextResponse.json(
        { success: false, error: "identity_id is required" },
        { status: 400 }
      );
    }

    const authorization = await authorizeUserTarget(identityId);
    if (!authorization.allowed) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const phone = syntheticIdToPhone(identityId);
    const user = phone
      ? await ensureUserForPhone(phone)
      : (await getUserByIdentityId(identityId)).data;
    return NextResponse.json({ success: true, data: user || null });
  } catch (error) {
    console.error(
      "GET /api/user-supabase failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityId = body.identity_id || body.clerk_user_id;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!identityId || !name) {
      return NextResponse.json(
        { success: false, error: "identity_id and name are required" },
        { status: 400 }
      );
    }

    const authorization = await authorizeUserTarget(identityId);
    if (!authorization.allowed) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const phone = syntheticIdToPhone(identityId);
    if (phone) {
      const user = await ensureUserForPhone(phone);
      return NextResponse.json({ success: true, data: user }, { status: 200 });
    }

    const userData: MobileUserData = {
      clerk_user_id: identityId,
      name,
      photo: body.photo ?? null,
    };
    const result = await createUser(userData);
    return NextResponse.json(
      { success: result.success, data: result.data, error: result.error },
      { status: result.success ? 201 : 400 }
    );
  } catch (error) {
    console.error(
      "POST /api/user-supabase failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const identityId = body.identity_id || body.clerk_user_id;
    if (!identityId) {
      return NextResponse.json(
        { success: false, error: "identity_id is required" },
        { status: 400 }
      );
    }

    const authorization = await authorizeUserTarget(identityId);
    if (!authorization.allowed) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const updates = {
      ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
      ...(body.photo !== undefined ? { photo: body.photo } : {}),
      ...(body.chef !== undefined ? { chef: body.chef } : {}),
      ...(body.role !== undefined ? { role: body.role } : {}),
    };
    if (!authorization.isAdmin) {
      const allowed = new Set(["name", "photo", "chef"]);
      if (Object.keys(updates).some((key) => !allowed.has(key))) {
        return NextResponse.json(
          { success: false, error: "Forbidden update field" },
          { status: 403 }
        );
      }
    }

    const result = await updateUser(identityId, updates);
    return NextResponse.json(
      { success: result.success, data: result.data, error: result.error },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    console.error(
      "PUT /api/user-supabase failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
