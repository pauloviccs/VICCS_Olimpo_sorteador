import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateSnapshotHash } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { giveaway_id, winners_count = 1, alternates_count = 1 } = body;

    if (!giveaway_id) {
      return NextResponse.json(
        { error: "giveaway_id é obrigatório." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();

    // 1. Busca todas as entradas elegíveis do sorteio
    const { data: eligibleEntries, error } = await supabase
      .from("giveaway_entries")
      .select("id, ig_username, comment_snippet, created_at")
      .eq("giveaway_id", giveaway_id)
      .eq("is_eligible", true)
      .order("created_at", { ascending: true });

    if (error || !eligibleEntries || eligibleEntries.length === 0) {
      return NextResponse.json(
        { error: "Nenhum participante elegível encontrado para sortear." },
        { status: 400 }
      );
    }

    // 2. Gera prova criptográfica imutável (Snapshot SHA-256)
    const snapshotHash = generateSnapshotHash({
      giveaway_id,
      timestamp: Date.now(),
      total_eligible: eligibleEntries.length,
      participants_ids: eligibleEntries.map((e) => e.id),
    });

    // 3. Embaralhamento Fisher-Yates com gerador criptograficamente seguro (CSPRNG)
    const shuffled = [...eligibleEntries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 4. Seleciona os Vencedores e Suplentes
    const winners = shuffled.slice(0, winners_count);
    const alternates = shuffled.slice(
      winners_count,
      winners_count + alternates_count
    );

    const drawResultsToInsert = [
      ...winners.map((entry, idx) => ({
        giveaway_id,
        entry_id: entry.id,
        position: idx + 1,
        is_alternate: false,
        status: "selected",
        snapshot_sha256: snapshotHash,
      })),
      ...alternates.map((entry, idx) => ({
        giveaway_id,
        entry_id: entry.id,
        position: idx + 1,
        is_alternate: true,
        status: "selected",
        snapshot_sha256: snapshotHash,
      })),
    ];

    await supabase.from("draw_results").insert(drawResultsToInsert);

    // 5. Marca a campanha como 'drawn'
    await supabase
      .from("giveaways")
      .update({
        status: "drawn",
        drawn_at: new Date().toISOString(),
        eligible_entries_count: eligibleEntries.length,
      })
      .eq("id", giveaway_id);

    return NextResponse.json({
      success: true,
      snapshot_sha256: snapshotHash,
      winners: winners.map((w, idx) => ({
        position: idx + 1,
        username: w.ig_username,
        comment: w.comment_snippet,
      })),
      alternates: alternates.map((a, idx) => ({
        position: idx + 1,
        username: a.ig_username,
        comment: a.comment_snippet,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro no sorteio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
