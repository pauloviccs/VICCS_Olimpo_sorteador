/**
 * Módulo de Integração Oficial Meta Graph API v21.0 (Instagram Business/Creator)
 * Não utiliza scraping nem robôs. Todas as chamadas respeitam o protocolo OAuth e paginação por cursores.
 */

const GRAPH_BASE_URL = "https://graph.facebook.com/v21.0";

export interface MetaMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  comments_count: number;
}

export interface MetaCommentItem {
  id: string;
  text: string;
  timestamp: string;
  like_count?: number;
  from?: {
    id: string;
    username: string;
  };
  username?: string; // Algumas versões da Graph API retornam direto no primeiro nível
}

export interface CommentsPageResponse {
  data: MetaCommentItem[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
}

/**
 * Gera a URL oficial de autorização OAuth da Meta
 */
export function getMetaAuthUrl(state: string): string {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI;
  const authFlow = process.env.META_AUTH_FLOW || "facebook";

  if (!appId || !redirectUri) {
    throw new Error("META_APP_ID ou NEXT_PUBLIC_META_REDIRECT_URI não configurados.");
  }

  if (authFlow === "instagram") {
    const scopes =
      process.env.META_SCOPES ||
      "instagram_business_basic,instagram_business_manage_comments";

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes,
      state,
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  const scopes =
    process.env.META_SCOPES ||
    [
      "instagram_basic",
      "instagram_manage_comments",
      "pages_show_list",
      "pages_read_engagement",
    ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope: scopes,
  });

  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

/**
 * Troca o código temporário retornado no callback por um Short-Lived Access Token
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI;

  const params = new URLSearchParams({
    client_id: appId || "",
    client_secret: appSecret || "",
    redirect_uri: redirectUri || "",
    code,
  });

  const res = await fetch(`${GRAPH_BASE_URL}/oauth/access_token?${params.toString()}`, {
    method: "GET",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(`Erro na troca de código OAuth: ${JSON.stringify(errorBody)}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Troca o token de curta duração por um Long-Lived Token (válido por ~60 dias)
 */
export async function getLongLivedToken(shortLivedToken: string): Promise<{ token: string; expiresIn: number }> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId || "",
    client_secret: appSecret || "",
    fb_exchange_token: shortLivedToken,
  });

  const res = await fetch(`${GRAPH_BASE_URL}/oauth/access_token?${params.toString()}`);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(`Erro ao obter Long-Lived Token: ${JSON.stringify(errorBody)}`);
  }

  const data = await res.json();
  return {
    token: data.access_token,
    expiresIn: data.expires_in || 5184000, // ~60 dias em segundos
  };
}

/**
 * Descobre as contas profissionais do Instagram conectadas ao usuário
 */
export async function getConnectedInstagramAccounts(accessToken: string) {
  const url = `${GRAPH_BASE_URL}/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`;
  const res = await fetch(url);

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(`Erro ao buscar contas conectadas: ${JSON.stringify(errorBody)}`);
  }

  const data = await res.json();
  const accounts: Array<{
    pageId: string;
    pageName: string;
    igUserId: string;
    igUsername: string;
    profilePicture?: string;
  }> = [];

  for (const page of data.data || []) {
    if (page.instagram_business_account) {
      accounts.push({
        pageId: page.id,
        pageName: page.name,
        igUserId: page.instagram_business_account.id,
        igUsername: page.instagram_business_account.username,
        profilePicture: page.instagram_business_account.profile_picture_url,
      });
    }
  }

  return accounts;
}

/**
 * Lista as publicações recentes da conta do Instagram conectada
 */
export async function getAccountMedia(
  igUserId: string,
  accessToken: string,
  limit = 20
): Promise<MetaMediaItem[]> {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count";
  const url = `${GRAPH_BASE_URL}/${igUserId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(`Erro ao listar mídias da conta: ${JSON.stringify(errorBody)}`);
  }

  const data = await res.json();
  return data.data || [];
}

/**
 * Busca uma fatia (chunk) de comentários de uma publicação usando paginação por cursor
 */
export async function fetchMediaCommentsChunk(
  mediaId: string,
  accessToken: string,
  afterCursor?: string,
  limit = 50
): Promise<CommentsPageResponse> {
  const fields = "id,text,timestamp,like_count,from,username";
  const params = new URLSearchParams({
    fields,
    limit: limit.toString(),
    access_token: accessToken,
  });

  if (afterCursor) {
    params.set("after", afterCursor);
  }

  const url = `${GRAPH_BASE_URL}/${mediaId}/comments?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(`Erro ao carregar fatia de comentários: ${JSON.stringify(errorBody)}`);
  }

  return res.json();
}
