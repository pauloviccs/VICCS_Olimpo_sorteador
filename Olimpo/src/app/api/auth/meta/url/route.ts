import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getMetaAuthUrl } from "@/lib/meta/api";

export async function GET() {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const cookieStore = await cookies();

    // Salva o state em cookie httpOnly para proteção contra CSRF
    cookieStore.set("meta_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutos
      path: "/",
    });

    const authUrl = getMetaAuthUrl(state);
    return NextResponse.json({ url: authUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
