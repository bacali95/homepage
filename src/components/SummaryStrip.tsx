import { cn, pingStatusOf, type PingStatus } from "@/lib/utils";
import type { App } from "@/types";

import type { PingHistory } from "../../generated/client/client";
import { StatusDot } from "./primitives";

interface SummaryStripProps {
  apps: App[];
  pings: Map<number, [PingHistory[], number]>;
}

export function summarize(
  apps: App[],
  pings: Map<number, [PingHistory[], number]>
) {
  let up = 0;
  let down = 0;
  for (const app of apps) {
    if (!app.pingPreferences?.enabled) continue;
    const status: PingStatus = pingStatusOf(pings.get(app.id)?.[0][0]);
    if (status === "up" || status === "slow") up++;
    if (status === "down") down++;
  }
  const updates = apps.filter(
    (app) => app.versionPreferences?.enabled && app.versionPreferences.hasUpdate
  ).length;
  return { total: apps.length, up, down, updates };
}

function Stat({
  label,
  value,
  tone,
  dot,
}: {
  label: string;
  value: number;
  tone?: string;
  dot?: PingStatus;
}) {
  return (
    <div className="flex items-baseline gap-2 px-4 py-2.5">
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        {dot && <StatusDot status={dot} />}
        {label}
      </dt>
      <dd className={cn("text-lg font-semibold tabular-nums", tone)}>
        {value}
      </dd>
    </div>
  );
}

export function SummaryStrip({ apps, pings }: SummaryStripProps) {
  const { total, up, down, updates } = summarize(apps, pings);

  return (
    <section aria-label="Status summary" className="mb-8">
      <dl className="grid grid-cols-2 divide-line overflow-hidden rounded-card border border-line bg-surface sm:flex sm:divide-x [&>div]:border-line max-sm:[&>div:nth-child(-n+2)]:border-b max-sm:[&>div:nth-child(odd)]:border-r">
        <Stat label="Apps" value={total} />
        <Stat label="Up" value={up} dot="up" />
        <Stat
          label="Down"
          value={down}
          dot="down"
          tone={down > 0 ? "text-down" : undefined}
        />
        <Stat
          label="Updates"
          value={updates}
          tone={updates > 0 ? "text-accent" : undefined}
        />
      </dl>
    </section>
  );
}
