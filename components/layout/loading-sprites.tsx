import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Pixel sprites kept in `public/loading-sprites` so the loading screen needs no network request.
 * Each runner has its own speed and start time, so they trail across the screen at different paces.
 */
const RUNNERS = [
  { id: 25, duration: 5.2, delay: 0 },
  { id: 4, duration: 6.4, delay: 0.9 },
  { id: 133, duration: 5.6, delay: 1.7 },
  { id: 59, duration: 4.4, delay: 2.4 },
  { id: 263, duration: 6.8, delay: 3.1 },
  { id: 448, duration: 5, delay: 3.8 },
  { id: 258, duration: 6, delay: 4.5 },
] as const;

/**
 * A row of Pokémon pixel sprites running across the screen while data loads. The sprites are
 * decoration only, so they are hidden from assistive technology. People who ask for reduced
 * motion see them standing still in a row.
 */
export function LoadingSprites({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("loading-track", className)} data-loading-sprites>
      {RUNNERS.map((runner) => (
        <div
          key={runner.id}
          className="loading-runner"
          style={{
            animationDuration: `${runner.duration}s`,
            animationDelay: `${runner.delay}s`,
          }}
        >
          <div className="loading-bob">
            <Image
              src={`/loading-sprites/${runner.id}.gif`}
              alt=""
              width={96}
              height={96}
              unoptimized
              priority
              className="h-16 w-auto -scale-x-100 [image-rendering:pixelated]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
