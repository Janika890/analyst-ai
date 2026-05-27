import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Analyst AI | Website Analyzer",
  description: "AI-powered website analysis — SEO, technical, content insights",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hu" className={geist.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
