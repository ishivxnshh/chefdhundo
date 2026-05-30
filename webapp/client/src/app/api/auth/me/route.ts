import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/server";

export async function GET() {
  try {
    const user = await currentUser();
    return NextResponse.json({
      isSignedIn: !!user,
      user,
    });
  } catch (error) {
    console.error("auth me error:", error);
    return NextResponse.json({ isSignedIn: false, user: null }, { status: 200 });
  }
}
