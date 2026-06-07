import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/server";

export async function GET() {
  try {
    const user = await currentUser();
    const response = NextResponse.json({
      isSignedIn: !!user,
      user,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("auth me error:", error);
    const response = NextResponse.json(
      { isSignedIn: false, user: null, error: "Unable to load session" },
      { status: 503 }
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
