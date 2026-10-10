import type { CalculatedStat } from "@/lib/stats/battleStat";
import { STAT_LABELS, type StatId, type StatSpread } from "@/lib/types/stats";

const CHART_ORDER: StatId[] = ["hp", "atk", "def", "spe", "spd", "spa"];

const SHORT_LABELS: Record<StatId, string> = {
  hp: "HP",
  atk: "Attack",
  def: "Defense",
  spa: "Sp. Atk",
  spd: "Sp. Def",
  spe: "Speed",
};

const PLACEMENT: Record<StatId, string> = {
  spa: "col-start-1 row-start-1 justify-self-end self-end text-right",
  hp: "col-start-2 row-start-1 justify-self-center self-end text-center",
  atk: "col-start-3 row-start-1 justify-self-start self-end text-left",
  spd: "col-start-1 row-start-2 justify-self-end self-center text-right",
  def: "col-start-3 row-start-2 justify-self-start self-center text-left",
  spe: "col-start-2 row-start-3 justify-self-center self-start text-center",
};

export function StatRadar({ stats, evs }: { stats: CalculatedStat[]; evs: StatSpread }) {
  const byId = new Map(stats.map((stat) => [stat.stat, stat]));
  const ordered = CHART_ORDER.map((stat) => byId.get(stat)).filter((stat): stat is CalculatedStat => stat !== undefined);
  const peak = Math.max(1, ...ordered.map((stat) => stat.value));
  const scale = peak * 1.18;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_minmax(0,1fr)] grid-rows-[auto_7.5rem_auto] items-center gap-x-2 gap-y-1 sm:grid-cols-[minmax(0,1fr)_11rem_minmax(0,1fr)] sm:grid-rows-[auto_11rem_auto]">
      {ordered.map((stat) => (
        <StatReadout key={stat.stat} stat={stat} ev={evs[stat.stat]} />
      ))}
      <svg viewBox="0 0 100 100" className="col-start-2 row-start-2 size-full" aria-hidden="true">
        {[1, 0.66, 0.33].map((ring) => (
          <polygon
            key={ring}
            points={hexPoints(50, 50, 42 * ring)}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="0.6"
          />
        ))}
        {CHART_ORDER.map((_, index) => {
          const [x, y] = polar(50, 50, 42, index);
          return <line key={index} x1="50" y1="50" x2={x} y2={y} stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />;
        })}
        <polygon
          points={ordered
            .map((stat, index) => {
              const radius = 42 * Math.min(1, stat.value / scale);
              const [x, y] = polar(50, 50, radius, index);
              return `${x},${y}`;
            })
            .join(" ")}
          fill="rgba(186, 224, 255, 0.55)"
          stroke="#f4fbff"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}

function StatReadout({ stat, ev }: { stat: CalculatedStat; ev: number }) {
  const tone =
    stat.natureEffect === "boost" ? "text-[#8fd4ff]" : stat.natureEffect === "drop" ? "text-[#ffc4c4]" : "text-white";
  return (
    <div className={`min-w-0 ${PLACEMENT[stat.stat]}`}>
      <p className={`text-xs font-medium ${tone}`}>
        <span className="sr-only">{STAT_LABELS[stat.stat]}</span>
        <span aria-hidden="true">{SHORT_LABELS[stat.stat]}</span>
        {stat.natureEffect === "boost" ? (
          <>
            <span className="sr-only">, increased</span>
            <span aria-hidden="true"> ↑</span>
          </>
        ) : null}
        {stat.natureEffect === "drop" ? (
          <>
            <span className="sr-only">, decreased</span>
            <span aria-hidden="true"> ↓</span>
          </>
        ) : null}
      </p>
      <p className={`text-lg font-mono font-semibold tabular-nums leading-none ${tone}`}>{stat.value}</p>
      <p className="text-[11px] text-[#b7d4ff]">EV {ev}</p>
    </div>
  );
}

function polar(cx: number, cy: number, radius: number, index: number): [number, number] {
  const angle = -Math.PI / 2 + (index * Math.PI) / 3;
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
}

function hexPoints(cx: number, cy: number, radius: number): string {
  return Array.from({ length: 6 }, (_, index) => polar(cx, cy, radius, index).join(",")).join(" ");
}
