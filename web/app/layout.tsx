import { THEME_INIT_SCRIPT } from "@/lib/theme";
import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "OpenReturn — Tax Prep",
  description: "AI CPA platform for high-net-worth individuals.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * The CSP nonce from proxy.ts. Reading a request header also makes
   * every page render per request, which the nonce requires.
   */
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    /*
     * suppressHydrationWarning: THEME_INIT_SCRIPT sets data-theme on <html>
     * before React hydrates, so the attribute differs from the server render.
     */
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body className="h-full bg-bg-base font-sans text-ink-primary antialiased">
        <Script id="theme-init" strategy="beforeInteractive" nonce={nonce}>
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
