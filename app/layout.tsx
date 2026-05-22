import type { Metadata } from "next";
import { JetBrains_Mono, Roboto } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { themeInitScript } from "@/lib/theme/init-script";

const roboto = Roboto({
  variable: "--font-app-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "HRM · DeltaYards",
  description: "Human resources management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${fontMono.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col bg-background font-sans text-foreground"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
