import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com permissões administrativas (Service Role)
 * Usado EXCLUSIVAMENTE em rotas seguras do servidor para persistir credenciais
 * da Meta e executar atualizações atômicas nos jobs de importação.
 * NUNCA importar este arquivo em componentes do cliente.
 */
export function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configurados.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
