import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/Container";
import { Analytics } from "@vercel/analytics/react";
import type { Viewport } from "next";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Therapist Lite",
    template: "%s | Therapist Lite",
  },
  description: "Lightweight therapist notes, scheduling, and client management.",
  applicationName: "Therapist Lite",
  keywords: [
    "therapy",
    "notes",
    "scheduling",
    "clients",
    "practice management",
  ],
  authors: [{ name: "Therapist Lite" }],
  creator: "Therapist Lite",
  publisher: "Therapist Lite",
  category: "productivity",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Therapist Lite",
    title: "Therapist Lite",
    description: "Lightweight therapist notes, scheduling, and client management.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Therapist Lite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@therapistlite",
    creator: "@therapistlite",
    title: "Therapist Lite",
    description: "Lightweight therapist notes, scheduling, and client management.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main className="py-8">
          <Container>
            {children}
          </Container>
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
