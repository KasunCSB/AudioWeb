import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ScrollStyles } from "./components/scrollstyles";
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
    images: [
      {
        url: "https://audioweb.vercel.app/images/aw-banner.png",
        width: 1280,
        height: 720,
        alt: "AudioWeb Music Player Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AudioWeb Music Player",
    description: "A modern web-based music player for playing your favorite audio files directly in your browser.",
    images: ["https://audioweb.vercel.app/images/aw-banner.png"],
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#14141c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AudioWeb" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased`}
      >
        <ScrollStyles />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
