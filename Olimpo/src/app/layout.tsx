import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Olimpo — Sorteador Oficial do Instagram",
  description: "Plataforma auditável, transparente e segura para sorteios no Instagram da Olimpo Açaíteria & Sorveteria. 100% via API oficial da Meta.",
  icons: {
    icon: "/brand/svg/OLIMPO_VisualAsset_0_Logo_Circular_Colored_a.svg",
    apple: "/brand/2x/OLIMPO_VisualAsset_0_Logo_Circular_Colored_a@2x.png",
  },
  openGraph: {
    title: "Olimpo — Sorteador Oficial do Instagram",
    description: "Sorteios transparentes e auditáveis para Instagram com tecnologia oficial da Meta.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2d0f2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col selection:bg-[#662771] selection:text-[#f7ead8]">
        {children}
      </body>
    </html>
  );
}
