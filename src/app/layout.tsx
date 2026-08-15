import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import "./globals.css";

const display = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lilita",
});

const sans = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fuck-your-unhappy.vercel.app"),
  title: "Unhappy Buster | Private Stress Arcade",
  description: "Turn an everyday frustration into a ridiculous fictional boss, play for 30 seconds, and close the loop with perspective.",
  applicationName: "Unhappy Buster",
  keywords: ["stress reset", "private vent", "cartoon game", "emotional reset", "humor"],
  category: "entertainment",
  openGraph: {
    title: "Unhappy Buster",
    description: "Your bad mood needs a ridiculous fictional boss.",
    type: "website",
    images: [
      {
        url: "/stress-goblin.webp",
        width: 1024,
        height: 1024,
        alt: "The Unhappy Buster purple stress goblin mascot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unhappy Buster",
    description: "Turn a bad vibe into a 30-second fictional boss fight.",
    images: ["/stress-goblin.webp"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFF4D6",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
