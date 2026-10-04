// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteChrome } from "@/components/layout/site-chrome";
import { SerwistProvider } from "./serwist";

const inter = localFont({
  src: [
    { path: "../fonts/Inter.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/Inter-Italic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const lora = localFont({
  src: [
    { path: "../fonts/Lora.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/Lora-Italic.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "DNHS Enrollment",
  title: "Dimasalang National High School | Online Enrollment",
  description:
    "Official online pre-enrollment system of Dimasalang National High School, Dimasalang, Masbate. Founded 1952.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DNHS Enrollment",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f2a5c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SerwistProvider swUrl="/serwist/sw.js">
          <SiteChrome>{children}</SiteChrome>
        </SerwistProvider>
      </body>
    </html>
  );
}
