import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Bangers } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const bangers = Bangers({
  variable: "--font-bangers",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fuck Your Unhappy",
  description: "Smash your stress into oblivion",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${bangers.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
