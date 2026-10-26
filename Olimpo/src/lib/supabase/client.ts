import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o Navegador (Frontend)
 * Utiliza a chave pública anônima (NEXT_PUBLIC_SUPABASE_ANON_KEY).
 * Seguro para expor no cliente — o acesso aos dados é protegido por Row Level Security (RLS).
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
