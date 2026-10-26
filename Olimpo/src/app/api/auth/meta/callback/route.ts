import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getConnectedInstagramAccounts,
} from "@/lib/meta/api";
import { encryptToken } from "@/lib/security";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error_description") || searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${appUrl}?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}?error=codigo_ausente`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("meta_oauth_state")?.value;

  // Validação CSRF
  if (!state || state !== savedState) {
    return NextResponse.redirect(`${appUrl}?error=state_invalido_csrf`);
  }

  try {
    // 1. Limpa sufixo #_ adicionado pela Meta e troca code por token
    const cleanCode = code.replace(/#_.*$/, "");
    const shortToken = await exchangeCodeForToken(cleanCode);

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

    // 4. Garante a existência de um workspace padrão para o usuário/admin
    let workspaceId: string;
    const { data: existingWorkspaces } = await supabase
      .from("workspaces")
      .select("id")
      .limit(1);

    if (existingWorkspaces && existingWorkspaces.length > 0) {
      workspaceId = existingWorkspaces[0].id;
    } else {
      // Cria workspace de bootstrap se não existir nenhum
      const { data: newWs, error: wsError } = await supabase
        .from("workspaces")
        .insert({
          name: "Olimpo Açaíteria",
          owner_id: "00000000-0000-0000-0000-000000000000", // Placeholder até autenticação por usuário ser ativada
        })
        .select("id")
        .single();

      if (wsError || !newWs) {
        // Se a constraint de auth.users falhar sem usuário logado, tenta vincular sem criar
        workspaceId = "00000000-0000-0000-0000-000000000000";
      } else {
        workspaceId = newWs.id;
      }
    }

    // 5. Salva a conta com o token criptografado
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

    // Limpa o cookie de CSRF
    cookieStore.delete("meta_oauth_state");

    return NextResponse.redirect(
      `${appUrl}?connected=true&ig_user=${encodeURIComponent(primaryAccount.igUsername)}`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.redirect(`${appUrl}?error=${encodeURIComponent(message)}`);
  }
}
