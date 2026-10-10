import type { Metadata } from "next";
import { Geist, Geist_Mono, Kanit } from "next/font/google";
import localFont from "next/font/local";
import { MobileDockBar } from "@/components/layout/mobile-dock-bar";
import { SceneBackdrop } from "@/components/layout/scene-backdrop";
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

/**
 * Headings, tabs, and navigation. The typeface used in the games is not licensed for web use, so this is
 * an open-licensed Google font with the same bold, wide, rounded-corner feel as the in-game menus.
 */
const display = Kanit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
  fallback: ["Geist", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
});

/**
 * Page titles and the header brand. "Pokémon Solid" is a fan-made recreation of the lettering in the Pokémon
 * logo (the logo itself is custom artwork, not a font). It is a single weight, so never ask for bold. If its
 * licence ever becomes a problem, delete this font and the `--font-logo` rule in globals.css; titles fall
 * back to Kanit.
 *
 * The file's Windows metrics describe a box nearly three times the letter height, which made each title's
 * hit area cover the link above it. The overrides use the file's own `hhea` metrics (2048 / -819 of 2048).
 */
const logo = localFont({
  src: "./fonts/pokemon-solid.ttf",
  variable: "--font-logo",
  display: "swap",
  declarations: [
    { prop: "ascent-override", value: "100%" },
    { prop: "descent-override", value: "40%" },
    { prop: "line-gap-override", value: "0%" },
  ],
  fallback: ["Kanit", "Geist", "sans-serif"],
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
    <html lang="en" className={cn(geistSans.variable, geistMono.variable, display.variable, logo.variable, "h-full antialiased")}>
      <body className="relative flex min-h-full flex-col font-sans max-lg:pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <SceneBackdrop />
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
