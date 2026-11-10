import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IND-voice — Multilingual Voice-First Business Ledger",
  description: "Institutional voice-first record-keeping for Indian small merchants and Kirana shopkeepers in Hindi, Hinglish, Marathi, and English.",
  icons: {
    icon: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#F8FAFC] text-[#000000] flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
