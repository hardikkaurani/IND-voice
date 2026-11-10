import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IND-voice — Multilingual Voice-First Business Ledger",
  description: "Natural voice-first record-keeping for Indian small merchants and Kirana shopkeepers in Hindi, Hinglish, Marathi, and English.",
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
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-[#171721] text-[#EDEDF3] flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
