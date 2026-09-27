import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

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
  title: "Dimasalang National High School | Online Enrollment",
  description:
    "Official online pre-enrollment system of Dimasalang National High School, Dimasalang, Masbate. Founded 1952.",
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
        <SiteHeader />
        <main className="flex-1 bg-secondary">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
