import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, generateSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    return NextResponse.json(
      { error: "SITE_PASSWORD is not configured" },
      { status: 500 }
    );
  }

  const { password: submitted } = await request.json();

  // Constant-time comparison
  const a = password;
  const b = String(submitted ?? "");
  let mismatch = a.length !== b.length ? 1 : 0;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    mismatch |=
      (a.charCodeAt(i % a.length) ?? 0) ^ (b.charCodeAt(i % b.length) ?? 0);
  }

  if (mismatch !== 0) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await generateSessionToken();
  const response = NextResponse.json({ success: true });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
