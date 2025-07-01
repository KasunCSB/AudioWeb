import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AudioWeb Music Player - Play Audio Files Online",
  description: "A modern web-based music player for playing your favorite audio files directly in your browser. Supports multiple audio formats with an intuitive interface.",
  keywords: ["music player", "web audio player", "audio player", "music streaming", "browser music player", "online music player", "mp3 player"],
  authors: [{ name: "Kasun Chanaka" }],
  creator: "Kasun Chanaka",
  publisher: "Kasun Chanaka",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    title: "AudioWeb Music Player",
    description: "A modern web-based music player for playing your favorite audio files directly in your browser.",
    siteName: "AudioWeb",
    url: "https://audioweb.vercel.app",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://audioweb.vercel.app" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
