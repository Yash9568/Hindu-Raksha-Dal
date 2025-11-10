import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hindu Raksha Dal",
  description:
    "Community platform to share knowledge about Hindu culture, traditions, festivals, and values.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#ff0000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = new Date().getFullYear();
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-800`}>
        <Providers>
          <Header />
          <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">{children}</main>
          <footer className="py-8 text-center text-sm text-gray-500">© {year} Hindu Raksha Dal. All rights reserved.</footer>
        </Providers>
      </body>
    </html>
  );
}
