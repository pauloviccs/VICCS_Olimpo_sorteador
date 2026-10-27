import { NextRequest, NextResponse, connection } from "next/server";
import crypto from "crypto";
import { getMetaAuthUrl } from "@/lib/meta/api";

export async function GET(req: NextRequest) {
  // Sinaliza explicitamente ao Next.js 16 para não tentar pré-renderizar estaticamente
  await connection();

  try {
    const state = crypto.randomBytes(16).toString("hex");

    // Resolução dinâmica e robusta do Host / Domínio (Vercel ou Local)
    const host =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      "olimposorteador.vercel.app";

    const proto =
      req.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");

    const dynamicBaseUrl = `${proto}://${host}`;

    // Garante que o redirectUri aponte para o domínio correto sem barra final
    const redirectUri = (
      process.env.NEXT_PUBLIC_META_REDIRECT_URI ||
      `${dynamicBaseUrl}/api/auth/meta/callback`
    ).replace(/\/$/, "");

    const authUrl = getMetaAuthUrl(state, redirectUri);

    const response = NextResponse.json({
      url: authUrl,
      redirectUri,
    });

    // Salva o state no cookie da response para proteção contra CSRF compatível com Vercel Serverless
    response.cookies.set("meta_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || !host.includes("localhost"),
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutos
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      String((err as { digest?: unknown }).digest).startsWith("DYNAMIC_SERVER_USAGE")
    ) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Erro desconhecido ao gerar URL da Meta";
    console.error("[META_AUTH_URL_ERROR]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
