import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Sans, EB_Garamond } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// UI font — all interface labels, body text, navigation, buttons
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
  display: "swap",
});

// Wordmark only — used exclusively for the "Markman" logo in nav
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

// Data / tables — dates, numeric values, serial numbers needing alignment
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Markman",
  description: "Brand protection for founders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        instrumentSans.variable,
        ebGaramond.variable,
        geistMono.variable,
      )}
    >
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
