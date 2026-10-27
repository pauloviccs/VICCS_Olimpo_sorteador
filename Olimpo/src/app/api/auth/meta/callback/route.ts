import { NextRequest, NextResponse, connection } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getConnectedInstagramAccounts,
} from "@/lib/meta/api";
import { encryptToken } from "@/lib/security";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  // Sinaliza ao Next.js 16 para tratar esta requisição como dinâmica
  await connection();

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error_description") || searchParams.get("error");

  // Resolução dinâmica do domínio base da aplicação (sempre compatível com Vercel)
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "olimposorteador.vercel.app";

  const proto =
    req.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`).replace(/\/$/, "");
  const redirectUri = (
    process.env.NEXT_PUBLIC_META_REDIRECT_URI ||
    `${appUrl}/api/auth/meta/callback`
  ).replace(/\/$/, "");

  if (error) {
    console.error("[META_AUTH_OAUTH_ERROR]:", error);
    return NextResponse.redirect(`${appUrl}?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}?error=codigo_ausente`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("meta_oauth_state")?.value;

  // Validação CSRF com suporte a políticas de segurança mobile / ITP
  if (savedState && state !== savedState) {
    console.warn("[CSRF_WARNING]: State recebido não coincide com o cookie salvo.");
    return NextResponse.redirect(`${appUrl}?error=state_invalido_csrf`);
  }

  try {
    // 1. Limpa sufixo #_ adicionado pela Meta e troca code por token com o redirect_uri idêntico
    const cleanCode = code.replace(/#_.*$/, "");
    const shortToken = await exchangeCodeForToken(cleanCode, redirectUri);

    // 2. Troca por token de longa duração (~60 dias)
    const { token: longLivedToken, expiresIn } = await getLongLivedToken(shortToken);

    // 3. Descobre a conta do Instagram Business associada
    const accounts = await getConnectedInstagramAccounts(longLivedToken);

    if (accounts.length === 0) {
      return NextResponse.redirect(
        `${appUrl}?error=nenhuma_conta_profissional_encontrada`
      );
    }

    const primaryAccount = accounts[0];
    const supabase = getAdminSupabaseClient();

    // 4. Garante a existência de um workspace padrão para a Olimpo
    let workspaceId: string;
    const { data: existingWorkspaces } = await supabase
      .from("workspaces")
      .select("id")
      .limit(1);

    if (existingWorkspaces && existingWorkspaces.length > 0) {
      workspaceId = existingWorkspaces[0].id;
    } else {
      const { data: newWs, error: wsError } = await supabase
        .from("workspaces")
        .insert({
          name: "Olimpo Açaíteria",
          owner_id: "00000000-0000-0000-0000-000000000000",
        })
        .select("id")
        .single();

      if (wsError || !newWs) {
        workspaceId = "00000000-0000-0000-0000-000000000000";
      } else {
        workspaceId = newWs.id;
      }
    }

    // 5. Salva a conta com o token criptografado com AES-256
    const encryptedToken = encryptToken(longLivedToken);
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabase.from("instagram_accounts").upsert(
      {
        workspace_id: workspaceId,
        ig_user_id: primaryAccount.igUserId,
        username: primaryAccount.igUsername,
        profile_picture_url: primaryAccount.profilePicture,
        access_token_enc: encryptedToken,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,ig_user_id" }
    );

    // 6. Redireciona com sucesso e limpa o cookie CSRF na resposta
    const response = NextResponse.redirect(
      `${appUrl}?connected=true&ig_user=${encodeURIComponent(primaryAccount.igUsername)}`
    );
    response.cookies.delete("meta_oauth_state");
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
    const message = err instanceof Error ? err.message : "Erro no callback da Meta";
    console.error("[META_CALLBACK_EXCEPTION]:", message);
    return NextResponse.redirect(`${appUrl}?error=${encodeURIComponent(message)}`);
  }
}
