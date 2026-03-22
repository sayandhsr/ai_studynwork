import type { Metadata } from "next";
import { Geist, Geist_Mono, EB_Garamond, Playfair_Display, Inter, Roboto, Lora, Libre_Baskerville, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FontProvider } from "@/components/font-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Productivity Hub | Human-Crafted Learning",
  description: "Capture wisdom with the warmth of a classic journal and the precision of AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning 
      className={`${ebGaramond.variable} ${playfair.variable} ${inter.variable} ${roboto.variable} ${lora.variable} ${libreBaskerville.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="luxury"
          enableSystem={false}
          disableTransitionOnChange
          themes={["luxury", "light", "dark"]}
        >
          <FontProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
