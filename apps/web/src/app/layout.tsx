import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const playfairDisplay = localFont({
  src: [
    { path: "./fonts/playfair-display/PlayfairDisplay-Variable.ttf", weight: "400 700", style: "normal" },
    { path: "./fonts/playfair-display/PlayfairDisplay-Italic-Variable.ttf", weight: "400 700", style: "italic" },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
  variable: "--font-playfair",
});

const inter = localFont({
  src: "./fonts/inter/Inter-Variable.ttf",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "UMSSPIRA",
  description: "Tu comunidad, siempre conectada.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  appleWebApp: { capable: true, title: "UMSSPIRA" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#1E3A5F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body className="font-sans bg-palladian text-abyssal-blue antialiased">
        {children}
      </body>
    </html>
  );
}
