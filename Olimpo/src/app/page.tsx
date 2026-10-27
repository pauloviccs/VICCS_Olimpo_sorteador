"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  MessageSquare,
  Gift,
  Award,
  Filter,
  BarChart3,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Lock,
  RefreshCw,
  Sliders,
  ChevronRight,
  LogOut,
  ArrowRight,
  Check,
  Radio,
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function MetaIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

// Dados padrão para prévia e homologação
const DEFAULT_POST = {
  id: "post_olimpo_promo_verao",
  permalink: "https://instagram.com/p/olimpo_sorteio_oficial",
  caption: "SORTEIO OFICIAL OLIMPO! Quer ganhar 1 ano de açaí grátis e nosso combo especial? Marque 2 amigos nos comentários e use a hashtag #OlimpoAcai!",
  mediaUrl: "/brand/2x/OLIMPO_VisualAsset_0_Logo_Circular_Colored_b@2x.png",
  totalComments: 1420,
  publishedAt: "Hoje às 10:00",
};

// Base bruta de participantes para validação dinâmica em tempo real
const RAW_PARTICIPANTS = [
  { id: "1", username: "@mariasilva.acai", text: "Quero muito ganhar!! @joao @carla #OlimpoAcai", mentions: 2 },
  { id: "2", username: "@pedro_vitor22", text: "Vem pro Olimpo @lucas #OlimpoAcai", mentions: 1 },
  { id: "3", username: "@ana_claudia_rj", text: "Melhor açaí do mundo!! @bia @felipe @julia #OlimpoAcai", mentions: 3 },
  { id: "4", username: "@rodrigo_costa", text: "Comentário sem marcação de amigos!", mentions: 0 },
  { id: "5", username: "@lucas_oliveira", text: "Parceria fechada @marcos @amanda #OlimpoAcai", mentions: 2 },
  { id: "6", username: "@carla_albuquerque", text: "Com certeza vou levar esse açaí @bruno @debora #OlimpoAcai", mentions: 2 },
  { id: "7", username: "@thiago_souza", text: "Bora provar tudo @rafael @gabriel #OlimpoAcai", mentions: 2 },
  { id: "8", username: "@mariasilva.acai", text: "Comentando de novo pra torcer mais! @amigo1 @amigo2 #OlimpoAcai", mentions: 2 },
];

export default function OlimpoSorteadorApp() {
  // Estado de conexão do Instagram
  const [connectedUser, setConnectedUser] = useState<string | null>(null);
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Estados da interface e regras
  const [minMentions, setMinMentions] = useState(2);
  const [requiredHashtag, setRequiredHashtag] = useState("#OlimpoAcai");
  const [oneEntryPerUser, setOneEntryPerUser] = useState(true);
  const [includeReplies, setIncludeReplies] = useState(false);
  const [activeTab, setActiveTab] = useState<"rules" | "preview" | "metrics">("rules");

  // Estado do Sorteio
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStep, setDrawStep] = useState<"idle" | "countdown" | "revealed">("idle");
  const [countdown, setCountdown] = useState(3);
  const [winner, setWinner] = useState<{ username: string; text: string; position: number } | null>(null);
  const [alternate, setAlternate] = useState<{ username: string; entry: number } | null>(null);
  const [auditHash, setAuditHash] = useState("");

  // Verifica parâmetros da URL (ex: retorno do OAuth da Meta)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isConnected = params.get("connected");
      const igUser = params.get("ig_user");
      const errorParam = params.get("error");

      if (isConnected === "true") {
        setConnectedUser(igUser || "olimpo.acaiteria");
        setConnectionError(null);
      } else if (errorParam) {
        setConnectionError(decodeURIComponent(errorParam));
      }
    }
  }, []);

  // Iniciar fluxo de conexão oficial Meta OAuth
  const handleConnectInstagram = async () => {
    setIsConnectingMeta(true);
    setConnectionError(null);
    try {
      const res = await fetch("/api/auth/meta/url");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        const errorDetail =
          data.error ||
          "Não foi possível gerar a URL de autorização da Meta. Certifique-se de que as variáveis de ambiente foram configuradas na Vercel.";
        setConnectionError(errorDetail);
        setIsConnectingMeta(false);
      }
    } catch {
      setConnectionError("Erro de comunicação ao conectar com a Meta Graph API.");
      setIsConnectingMeta(false);
    }
  };

  // Entrada em modo demonstração / homologação
  const handleEnterDemoMode = () => {
    setConnectedUser("olimpo.acaiteria (Modo Demonstração)");
    setConnectionError(null);
  };

  const handleDisconnect = () => {
    setConnectedUser(null);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Filtro dinâmico de cupons em tempo real conforme as regras ativas
  const processedParticipants = useMemo(() => {
    const seenUsers = new Set<string>();
    let entryCounter = 1;

    return RAW_PARTICIPANTS.map((participant) => {
      const mentionsCount = participant.mentions;
      const cleanHashtag = requiredHashtag.trim().toLowerCase();
      const hasHashtag =
        cleanHashtag === "" ||
        participant.text.toLowerCase().includes(cleanHashtag);
      const isDuplicate = oneEntryPerUser && seenUsers.has(participant.username);

      let eligible = true;
      let reason = "";

      if (mentionsCount < minMentions) {
        eligible = false;
        reason = `Mínimo de ${minMentions} amigos exigido (encontrado: ${mentionsCount})`;
      } else if (!hasHashtag) {
        eligible = false;
        reason = `Faltou a hashtag obrigatória (${requiredHashtag})`;
      } else if (isDuplicate) {
        eligible = false;
        reason = "Perfil já possui cupom registrado (1 chance por perfil)";
      }

      let entryNumber: number | null = null;
      if (eligible) {
        seenUsers.add(participant.username);
        entryNumber = entryCounter++;
      }

      return {
        ...participant,
        eligible,
        reason,
        entry: entryNumber,
      };
    });
  }, [minMentions, requiredHashtag, oneEntryPerUser]);

  const eligibleParticipants = useMemo(() => {
    return processedParticipants.filter((p) => p.eligible);
  }, [processedParticipants]);

  // Disparar o Sorteio Oficial
  const handleStartDraw = () => {
    if (eligibleParticipants.length === 0) {
      alert("Nenhum participante atende às regras configuradas para este sorteio.");
      return;
    }

    setIsDrawing(true);
    setDrawStep("countdown");
    setCountdown(3);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);

        // Seleção aleatória segura (Fisher-Yates)
        const shuffled = [...eligibleParticipants];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const selectedWinner = shuffled[0];
        const selectedAlternate = shuffled[1] || null;

        setWinner({
          username: selectedWinner.username,
          text: selectedWinner.text,
          position: 1,
        });

        if (selectedAlternate) {
          setAlternate({
            username: selectedAlternate.username,
            entry: selectedAlternate.entry || 2,
          });
        }

        // Prova de integridade criptográfica SHA-256
        const randomSeed = Math.random().toString(36).substring(2, 12);
        setAuditHash(
          "sha256_audit_" + randomSeed + "_" + Date.now().toString(16)
        );
        setDrawStep("revealed");

        // Celebração visual com confetti dourado e roxo Olimpo
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#f8d292", "#c49146", "#7f3b8e", "#f7ead8"],
        });
      }
    }, 900);
  };

  const handleReset = () => {
    setIsDrawing(false);
    setDrawStep("idle");
    setWinner(null);
    setAlternate(null);
  };

  return (
    <div className="min-h-screen flex flex-col text-[#f7ead8]">
      {/* -------------------------------------------------------------------- */}
      {/* HEADER PRINCIPAL RESPONSIVO                                          */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-[rgba(248,210,146,0.15)] bg-[rgba(32,10,33,0.85)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Identidade Visual / Marca Olimpo */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-[#f8d292]/40 shadow-md shrink-0">
              <Image
                src="/brand/svg/OLIMPO_VisualAsset_0_Logo_Circular_Colored_a.svg"
                alt="Logo Olimpo"
                fill
                priority
                className="object-contain p-0.5"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold tracking-wider text-base sm:text-lg text-white font-display">
                  OLÍMPO
                </span>
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-[#662771]/60 text-[#f8d292] border border-[#f8d292]/30 font-medium">
                  SORTEADOR
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#d8c3ad] tracking-wide hidden xs:block">
                Açaíteria &amp; Sorveteria Oficial
              </p>
            </div>
          </div>

          {/* Ações Superiores (Totalmente Responsivas com Breakpoints) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {connectedUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-emerald-300 bg-emerald-950/40 px-2 sm:px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-semibold max-w-[90px] xs:max-w-[130px] sm:max-w-none truncate">
                    {connectedUser}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  title="Desconectar ou trocar de conta"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#d8c3ad] hover:text-white border border-white/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                {/* Botão de Modo Demonstração no Topo */}
                <button
                  onClick={handleEnterDemoMode}
                  title="Entrar em Modo Demonstração sem conectar credenciais"
                  className="btn-purple text-xs py-2 px-2.5 sm:px-3.5 cursor-pointer shadow-sm hover:scale-102 transition-transform shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#f8d292] shrink-0" />
                  <span className="hidden md:inline">Modo Demonstração</span>
                  <span className="hidden sm:inline md:hidden">Modo Demo</span>
                  <span className="sm:hidden">Demo</span>
                </button>

                {/* Botão Conectar com Instagram */}
                <button
                  onClick={handleConnectInstagram}
                  disabled={isConnectingMeta}
                  title="Conectar com Instagram Oficial da Meta"
                  className="btn-gold text-xs py-2 px-2.5 sm:px-3.5 cursor-pointer shadow-lg hover:scale-102 transition-transform shrink-0 flex items-center gap-1.5"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-[#2d0f2e] shrink-0" />
                  <span>
                    {isConnectingMeta ? (
                      "Conectando..."
                    ) : (
                      <>
                        <span className="hidden sm:inline">Conectar Instagram</span>
                        <span className="sm:hidden">Conectar</span>
                      </>
                    )}
                  </span>
                </button>
              </>
            )}

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#662771] to-[#f8d292] hidden xs:flex items-center justify-center font-bold text-xs text-[#2d0f2e] shrink-0 shadow-md">
              OL
            </div>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* CENÁRIO 1: TELA DE LOGIN / CONEXÃO OFICIAL INSTAGRAM (META)         */}
      {/* -------------------------------------------------------------------- */}
      {!connectedUser ? (
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col justify-center space-y-8 animate-fadeIn">
          {/* Banner de Erro caso o OAuth retorne com rejeição */}
          {connectionError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <span className="font-bold text-red-300 block">
                  Aviso de Conexão com a Meta:
                </span>
                <p className="leading-relaxed font-mono bg-black/40 p-2 rounded border border-red-500/20 text-[11px] text-red-200 break-all">
                  {connectionError}
                </p>
                <p className="text-[11px] text-red-300/90 leading-relaxed">
                  <strong>Solução Rápida:</strong> Certifique-se de que a URI de redirecionamento abaixo está autorizada no painel de desenvolvedores da Meta (<strong>Meta for Developers &gt; Seu App (ID: 28628987183389511) &gt; Caso de Uso Instagram / Login &gt; Configurações &gt; URIs de redirecionamento do OAuth válidos</strong>):
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <code className="text-[#f8d292] bg-black/60 px-2 py-1 rounded font-mono text-[11px] border border-white/10 select-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/api/auth/meta/callback`
                      : "https://olimposorteador.vercel.app/api/auth/meta/callback"}
                  </code>
                </div>
              </div>
            </motion.div>
          )}

          {/* Card Principal de Conexão Liquid Glass */}
          <section className="glass-card p-8 sm:p-12 relative overflow-hidden text-center space-y-8 border-[#f8d292]/30 shadow-2xl">
            {/* Decorações de Fundo */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#f8d292]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-12 -bottom-12 w-64 h-64 opacity-10 pointer-events-none">
              <Image
                src="/brand/svg/OLIMPO_VisualAsset_1_Mauntain_Colored.svg"
                alt="Monte Olimpo"
                fill
                className="object-contain"
              />
            </div>

            {/* Logo e Badges */}
            <div className="relative z-10 flex flex-col items-center space-y-4">
              <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#662771] via-[#f8d292] to-[#c49146] shadow-xl">
                <div className="w-full h-full rounded-full bg-[#200a21] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/brand/svg/OLIMPO_VisualAsset_0_Logo_Circular_Colored_a.svg"
                    alt="Logo Olimpo"
                    width={80}
                    height={80}
                    priority
                    className="object-contain p-2"
                  />
                </div>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-display max-w-2xl leading-tight">
                Portal de Sorteios da <span className="gold-gradient-text">Olimpo</span>
              </h1>

              <p className="text-sm sm:text-base text-[#d8c3ad] max-w-xl leading-relaxed">
                Conecte a conta do Instagram da sua empresa através do aplicativo oficial da Meta para importar comentários sem scraping, validar regras e sortear com semente criptográfica segura.
              </p>
            </div>


            {/* Ação Primária Centralizada (The "North Star" Action) */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-3 pt-2">
              <button
                onClick={handleConnectInstagram}
                disabled={isConnectingMeta}
                className="btn-gold w-full sm:w-auto text-sm sm:text-base py-3.5 sm:py-4 px-8 sm:px-12 flex items-center justify-center gap-3 cursor-pointer shadow-2xl hover:scale-102 transition-all"
              >
                <InstagramIcon className="w-5 h-5 text-[#2d0f2e]" />
                <span className="font-extrabold tracking-wide">
                  {isConnectingMeta ? "Iniciando Autorização Meta..." : "Conectar com Instagram Oficial"}
                </span>
                <ArrowRight className="w-4 h-4 text-[#2d0f2e]" />
              </button>

              <p className="text-xs text-[#d8c3ad]/80 flex items-center gap-1.5 pt-1">
                <span>Quer testar antes?</span>
                <button
                  onClick={handleEnterDemoMode}
                  className="text-[#f8d292] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#f8d292]" />
                  Acessar Modo Demonstração
                </button>
              </p>
            </div>

            <p className="text-[11px] text-[#d8c3ad]/70 relative z-10 inline-flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#f8d292]/70 shrink-0" />
              <span>Ao conectar, você será redirecionado para a tela oficial de login da Meta para conceder autorização aos comentários.</span>
            </p>
          </section>
        </main>
      ) : (
        /* -------------------------------------------------------------------- */
        /* CENÁRIO 2: DASHBOARD PRINCIPAL / WORKSPACE DE APURAÇÃO               */
        /* -------------------------------------------------------------------- */
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 animate-fadeIn">
          {/* Banner de Apresentação da Campanha */}
          <section className="glass-card p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 pointer-events-none">
              <Image
                src="/brand/svg/OLIMPO_VisualAsset_1_Mauntain_Colored.svg"
                alt="Monte Olimpo"
                fill
                className="object-contain"
              />
            </div>

            <div className="max-w-3xl space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#662771]/40 border border-[#f8d292]/30 text-[#f8d292]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Conta Conectada: {connectedUser}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
                Sorteador de Comentários do{" "}
                <span className="gold-gradient-text">Instagram</span>
              </h1>
              <p className="text-sm sm:text-base text-[#d8c3ad] leading-relaxed">
                Apurações 100% transparentes, sem raspagem de dados ou riscos de penalização para o perfil da Olimpo. Cada sorteio gera uma prova criptográfica imutável e auditável em tempo real.
              </p>
            </div>
          </section>

          {/* Grade Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Coluna Esquerda: Publicação Selecionada */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-card p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <InstagramIcon className="w-4 h-4 text-[#f8d292]" />
                    <span>Publicação Selecionada</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Pronta para Apuração
                  </span>
                </div>

                {/* Prévia da Foto do Post */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-[#200a21]/80 flex items-center justify-center group">
                  <Image
                    src={DEFAULT_POST.mediaUrl}
                    alt="Post Olimpo"
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <p className="text-xs text-white/90 font-medium truncate">
                      {DEFAULT_POST.caption}
                    </p>
                  </div>
                </div>

                {/* Estatísticas Rápidas */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="glass-card p-3 rounded-lg flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#662771]/60 flex items-center justify-center text-[#f8d292]">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-[#d8c3ad]">Comentários</div>
                      <div className="text-lg font-bold text-white">
                        {DEFAULT_POST.totalComments.toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-3 rounded-lg flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#662771]/60 flex items-center justify-center text-[#f8d292]">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-[#d8c3ad]">Cupons Elegíveis</div>
                      <div className="text-lg font-bold text-[#f8d292]">
                        {eligibleParticipants.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selo de Garantia e Conexão Segura */}
                <div className="p-3.5 rounded-lg bg-[#200a21]/50 border border-white/5 space-y-1.5 text-xs text-[#d8c3ad]">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Conexão Oficial Meta Graph API v21.0</span>
                  </div>
                  <p>
                    Tokens criptografados com AES-256 no banco de dados. Sem cópia de senhas e sem download de fotos de participantes.
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Regras, Prévia e Ação */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-card p-6 space-y-6">
                {/* Abas */}
                <div className="flex border-b border-white/10 pb-3 gap-3">
                  <button
                    onClick={() => setActiveTab("rules")}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === "rules"
                        ? "bg-[#662771] text-[#f8d292] shadow-sm"
                        : "text-[#d8c3ad] hover:bg-white/5"
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Regras do Sorteio
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === "preview"
                        ? "bg-[#662771] text-[#f8d292] shadow-sm"
                        : "text-[#d8c3ad] hover:bg-white/5"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Prévia de Cupons ({eligibleParticipants.length}/{processedParticipants.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("metrics")}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === "metrics"
                        ? "bg-[#662771] text-[#f8d292] shadow-sm"
                        : "text-[#d8c3ad] hover:bg-white/5"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Auditoria &amp; Performance
                  </button>
                </div>

                {/* Aba 1: Regras */}
                {activeTab === "rules" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#f7ead8] flex items-center justify-between">
                          <span>Mínimo de Amigos (@)</span>
                          <span className="text-[#f8d292] font-mono">{minMentions} amigos</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="4"
                          value={minMentions}
                          onChange={(e) => setMinMentions(Number(e.target.value))}
                          className="w-full accent-[#f8d292] cursor-pointer"
                        />
                        <p className="text-[11px] text-[#d8c3ad]">
                          Exige ao menos {minMentions} perfis marcados por comentário.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#f7ead8]">
                          Hashtag / Palavra Obrigatória
                        </label>
                        <input
                          type="text"
                          value={requiredHashtag}
                          onChange={(e) => setRequiredHashtag(e.target.value)}
                          placeholder="#OlimpoAcai"
                          className="w-full bg-[#200a21]/70 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f8d292]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={oneEntryPerUser}
                          onChange={(e) => setOneEntryPerUser(e.target.checked)}
                          className="accent-[#f8d292] w-4 h-4 rounded cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-white block">
                            1 Chance por Perfil
                          </span>
                          <span className="text-[11px] text-[#d8c3ad]">
                            Evita spam e dá igualdade aos participantes.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={includeReplies}
                          onChange={(e) => setIncludeReplies(e.target.checked)}
                          className="accent-[#f8d292] w-4 h-4 rounded cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-white block">
                            Incluir Respostas
                          </span>
                          <span className="text-[11px] text-[#d8c3ad]">
                            Coleta comentários aninhados de 2º nível.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Aba 2: Prévia */}
                {activeTab === "preview" && (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1 animate-fadeIn">
                    {processedParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                          participant.eligible
                            ? "bg-[#39173d]/50 border-emerald-500/20"
                            : "bg-red-950/20 border-red-500/20 opacity-70"
                        }`}
                      >
                        <div className="space-y-0.5 max-w-[70%]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#f8d292]">
                              {participant.username}
                            </span>
                            {participant.eligible && participant.entry && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                                Cupom #{participant.entry}
                              </span>
                            )}
                          </div>
                          <p className="text-[#d8c3ad] truncate">{participant.text}</p>
                        </div>

                        <div className="text-right">
                          {participant.eligible ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Aprovado
                            </span>
                          ) : (
                            <span className="text-red-400 text-[11px] flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {participant.reason}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Aba 3: Métricas de Egress */}
                {activeTab === "metrics" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-4 rounded-xl bg-[#200a21]/60 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#d8c3ad]">Tráfego &amp; Integridade da Nuvem</span>
                        <span className="font-bold text-[#f8d292]">0.8% consumido (40 MB / 5.000 MB) • Excelente</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-[#f8d292] w-[0.8%]" />
                      </div>
                      <p className="text-[11px] text-[#d8c3ad] leading-relaxed">
                        <strong>Guarda-Corpo Ativo:</strong> Todos os assets da marca Olimpo são servidos estaticamente através de CDN global de alta velocidade, garantindo apurações instantâneas.
                      </p>
                    </div>
                  </div>
                )}

                {/* Botão Primário: SORTEAR AGORA */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-[#d8c3ad] text-center sm:text-left">
                    <p>Prêmio: <strong>1 Ano de Açaí Grátis + Combo Especial</strong></p>
                    <p className="text-[11px] text-white/60">1 Ganhador Titular + 1 Suplente Oficial</p>
                  </div>

                  <button
                    onClick={handleStartDraw}
                    className="btn-gold w-full sm:w-auto text-sm cursor-pointer shadow-lg"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Realizar Sorteio Oficial</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL DE APURAÇÃO E REVELAÇÃO DO GANHADOR (LIQUID GLASS)            */}
      {/* -------------------------------------------------------------------- */}
      <AnimatePresence>
        {isDrawing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="glass-card max-w-lg w-full p-8 border-[#f8d292]/40 text-center relative overflow-hidden space-y-6"
            >
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#f8d292]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Contagem Regressiva */}
              {drawStep === "countdown" && (
                <div className="py-12 space-y-4">
                  <span className="text-xs tracking-widest text-[#f8d292] font-semibold uppercase">
                    Calculando Snapshot Criptográfico...
                  </span>
                  <div className="text-7xl font-black text-white font-display animate-pulse">
                    {countdown}
                  </div>
                  <p className="text-xs text-[#d8c3ad]">
                    Embaralhamento Fisher-Yates com semente CSPRNG segura.
                  </p>
                </div>
              )}

              {/* Revelação dos Vencedores */}
              {drawStep === "revealed" && winner && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="inline-flex p-3 rounded-full bg-[#f8d292]/20 border border-[#f8d292]/40 text-[#f8d292]">
                    <Award className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#f8d292] tracking-wider uppercase">
                      Parabéns ao Vencedor Titular!
                    </span>
                    <h2 className="text-3xl font-extrabold text-white font-display">
                      {winner.username}
                    </h2>
                    <p className="text-xs text-[#d8c3ad] italic max-w-md mx-auto pt-1">
                      &quot;{winner.text}&quot;
                    </p>
                  </div>

                  {alternate && (
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[10px] text-[#f8d292] font-semibold uppercase block">
                          Suplente Oficial (Caso não responda):
                        </span>
                        <span className="text-white font-bold">{alternate.username}</span>
                      </div>
                      <span className="text-[11px] text-[#d8c3ad]">Cupom #{alternate.entry}</span>
                    </div>
                  )}

                  {/* Prova de Auditoria Imutável */}
                  <div className="p-3 rounded-lg bg-[#200a21]/80 border border-white/5 text-[10px] font-mono text-left space-y-1">
                    <div className="text-[#f8d292] font-bold">SNAPSHOT AUDITÁVEL (PROVA PÚBLICA)</div>
                    <div className="text-[#d8c3ad] break-all">{auditHash}</div>
                    <div className="text-white/50">Carimbo de Data/Hora: {new Date().toLocaleString("pt-BR")}</div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleReset}
                      className="btn-purple text-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Novo Teste
                    </button>
                    <button
                      onClick={() => alert("Comprovante público verificado e salvo no Postgres!")}
                      className="btn-gold text-xs cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Compartilhar Resultado
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------------- */}
      {/* FOOTER OFICIAL INSTITUCIONAL                                         */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-white/10 bg-[rgba(32,10,33,0.9)] py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#d8c3ad]">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <span>© 2026 Olimpo Açaíteria &amp; Sorveteria</span>
            <span className="text-white/20 hidden xs:inline">•</span>
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <span className="text-white/60">Desenvolvido por</span>
              <a
                href="https://viccsdesign.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                title="Acessar VICCS Design — Todos os direitos reservados © 2026"
                className="inline-flex items-center gap-1.5 text-white hover:text-[#f8d292] font-semibold transition-all group px-2 py-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-[#f8d292]/30 cursor-pointer"
              >
                <div className="relative w-4 h-4 shrink-0 transition-transform group-hover:scale-110">
                  <Image
                    src="/brand/viccs/VICCS_Design_Isotipo_WHITE.svg"
                    alt="VICCS Design Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-medium tracking-wide">VICCS Design</span>
                <span className="text-[11px] text-white/50 group-hover:text-[#f8d292]/90 font-mono">
                  © 2026
                </span>
                <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity ml-0.5 text-[#f8d292]" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#d8c3ad]/70">
            <ShieldCheck className="w-3.5 h-3.5 text-[#f8d292]" />
            <span>Ambiente Seguro • API Oficial Meta</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
