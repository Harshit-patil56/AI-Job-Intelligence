import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { FluidRoot } from "@/components/fluid-root";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "AI Job Intelligence | Autonomous Indian Tech Sourcing & Deduplication",
  description:
    "Real-time job intelligence feed with multi-source ATS harvesting, agency heuristics detection, and staged deduplication audit.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-sans bg-background text-foreground overflow-x-hidden" suppressHydrationWarning>
        <FluidRoot>{children}</FluidRoot>
      </body>
    </html>
  );
}
