import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/security";
import { fetchMediaCommentsChunk } from "@/lib/meta/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { giveaway_id, media_id, cursor } = body;

    if (!giveaway_id || !media_id) {
      return NextResponse.json(
        { error: "giveaway_id e media_id são obrigatórios." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();

    // 1. Busca a conta do Instagram e suas regras
    const { data: giveaway, error: giveawayError } = await supabase
      .from("giveaways")
      .select("*, instagram_accounts(access_token_enc)")
      .eq("id", giveaway_id)
      .single();

    if (giveawayError || !giveaway) {
      return NextResponse.json(
        { error: "Campanha de sorteio não encontrada." },
        { status: 404 }
      );
    }

    const encryptedToken = giveaway.instagram_accounts?.access_token_enc;
    if (!encryptedToken) {
      return NextResponse.json(
        { error: "Token de acesso do Instagram não disponível para este sorteio." },
        { status: 400 }
      );
    }

    const accessToken = decryptToken(encryptedToken);

    // 2. Busca regras ativas do sorteio
    const { data: rules } = await supabase
      .from("giveaway_rules")
      .select("*")
      .eq("giveaway_id", giveaway_id)
      .single();

    const minMentions = rules?.min_mentions ?? 1;
    const requireKeywords: string[] = rules?.require_keywords ?? [];

    // 3. Busca uma fatia de até 50 comentários da Meta Graph API
    const pageData = await fetchMediaCommentsChunk(media_id, accessToken, cursor, 50);
    const comments = pageData.data || [];

    // 4. Processa elegibilidade e prepara entradas
    const entriesToInsert = comments.map((comment) => {
      const text = comment.text || "";
      const username = comment.from?.username || comment.username || "participante_anônimo";
      const userId = comment.from?.id || "sem_id";

      // Extrai menções com regex @username
      const mentionMatches = text.match(/@([a-zA-Z0-9._]+)/g) || [];
      const mentionsCount = mentionMatches.length;

      // Validação de regras
      let isEligible = true;
      let rejectionReason: string | null = null;

      if (mentionsCount < minMentions) {
        isEligible = false;
        rejectionReason = `Exige no mínimo ${minMentions} menção(ões)`;
      } else if (requireKeywords.length > 0) {
        const hasRequired = requireKeywords.some((kw) =>
          text.toLowerCase().includes(kw.toLowerCase())
        );
        if (!hasRequired) {
          isEligible = false;
          rejectionReason = `Faltou a palavra-chave/hashtag obrigatória`;
        }
      }

      return {
        giveaway_id,
        comment_id: comment.id,
        ig_user_id: userId,
        ig_username: username,
        comment_snippet: text.substring(0, 200), // Armazena apenas snippet curto para economizar DB
        mentions_found: mentionMatches,
        is_eligible: isEligible,
        rejection_reason: rejectionReason,
      };
    });

    // 5. Inserção idempotente em lote no Supabase
    if (entriesToInsert.length > 0) {
      await supabase
        .from("giveaway_entries")
        .upsert(entriesToInsert, { onConflict: "giveaway_id,comment_id" });
    }

    const nextCursor = pageData.paging?.cursors?.after;
    const hasNextPage = Boolean(pageData.paging?.next && nextCursor);

    // 6. Atualiza o checkpoint no import_jobs
    await supabase
      .from("import_jobs")
      .update({
        cursor_after: nextCursor || null,
        status: hasNextPage ? "running" : "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("giveaway_id", giveaway_id);

    return NextResponse.json({
      chunk_size: entriesToInsert.length,
      has_next_page: hasNextPage,
      next_cursor: nextCursor,
      status: hasNextPage ? "running" : "completed",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro na importação";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
