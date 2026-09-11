import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Captain Voice Assistant | RAG Grounded Speech Command Deck",
  description: "Futuristic Captain Voice Assistant with RAG knowledge grounding, real-time multi-language translation (Amharic), and Edge Neural Voice synthesis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0B0F17] text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
