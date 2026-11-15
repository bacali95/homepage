import { AppCard } from "@/components/AppCard";
import type { App } from "@/types";

import type { PingHistory } from "../../generated/client/client";

interface AppsGridProps {
  groupedApps: Record<string, App[]>;
  sortedCategories: string[];
  pings: Map<number, [PingHistory[], number]>;
  onEdit: (app: App) => void;
  onDelete: (app: App) => void;
  onCheckUpdates: (app: App) => void;
  onShowHistory: (app: App) => void;
}

export function AppsGrid({
  groupedApps,
  sortedCategories,
  pings,
  onEdit,
  onDelete,
  onCheckUpdates,
  onShowHistory,
}: AppsGridProps) {
  return (
    <div className="space-y-8">
      {sortedCategories.map((category) => (
        <section key={category} aria-label={category}>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wider text-muted uppercase">
            <h2 className="font-medium">{category}</h2>
            <span className="rounded-full bg-raised px-1.5 py-px font-mono text-[0.6875rem] tabular-nums">
              {groupedApps[category].length}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-3">
            {groupedApps[category].map((app) => (
              <AppCard
                key={app.id}
                app={app}
                ping={pings.get(app.id)}
                onEdit={onEdit}
                onDelete={onDelete}
                onCheckUpdates={onCheckUpdates}
                onShowHistory={onShowHistory}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
