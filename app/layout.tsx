import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MobileDockBar } from "@/components/layout/mobile-dock-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RandomizerSessionProvider } from "@/components/session/session-provider";
import { TeamDockRail } from "@/components/teams/team-dock";
import { TeamProvider } from "@/components/teams/team-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  fallback: ["JetBrains Mono", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "Pokémon Randomizer",
    template: "%s · Pokémon Randomizer",
  },
  description:
    "Randomize a Pokémon, build a legal set, and copy it to Pokémon Showdown.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(geistSans.variable, geistMono.variable, "h-full antialiased")}>
      <body className="flex min-h-full flex-col font-sans max-lg:pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <SiteHeader />
        <RandomizerSessionProvider>
          <TeamProvider>
            {/* Capped at 1800px. From lg the team dock is a persistent right rail. */}
            <div className="mx-auto grid w-full max-w-[1800px] flex-1 lg:grid-cols-[minmax(0,1fr)_clamp(18.75rem,24vw,22.5rem)]">
              <main id="main" className="flex min-w-0 flex-col">
                {children}
              </main>
              <TeamDockRail />
            </div>
            <MobileDockBar />
          </TeamProvider>
        </RandomizerSessionProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
