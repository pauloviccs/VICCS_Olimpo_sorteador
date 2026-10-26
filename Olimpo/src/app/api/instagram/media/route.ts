import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/security";
import { getAccountMedia } from "@/lib/meta/api";

export async function GET() {
  try {
    const supabase = getAdminSupabaseClient();

    // Busca a conta mais recente conectada
    const { data: accounts, error } = await supabase
      .from("instagram_accounts")
      .select("id, ig_user_id, username, access_token_enc")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma conta do Instagram conectada." },
        { status: 404 }
      );
    }

    const account = accounts[0];
    const accessToken = decryptToken(account.access_token_enc);
    const media = await getAccountMedia(account.ig_user_id, accessToken, 20);

    return NextResponse.json({
      account: {
        id: account.id,
        username: account.username,
      },
      media,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao carregar mídias";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
