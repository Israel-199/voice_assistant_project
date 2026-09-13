import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Captain Voice Assistant | RAG Grounded Speech Command Deck",
  description: "Futuristic Captain Voice Assistant with RAG knowledge grounding, real-time multi-language translation (Amharic), and Edge Neural Voice synthesis.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B0F17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      <body className="min-h-full flex flex-col bg-[#0B0F17] text-slate-100 font-sans overflow-x-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {children}
      </body>
    </html>
  );
}

