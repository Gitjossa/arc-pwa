import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Arc — Trainingslog",
  description: "Log je sets, reps en gewicht per trainingsdag.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Arc",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
