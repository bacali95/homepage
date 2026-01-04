import { AppCard } from "@/components/AppCard";
import type { App } from "@/types";

interface AppsGridProps {
  groupedApps: Record<string, App[]>;
  sortedCategories: string[];
  onEdit: (app: App) => void;
  onDelete: (id: number) => void;
  onCheckUpdates: (app: App) => void;
}

export function AppsGrid({
  groupedApps,
  sortedCategories,
  onEdit,
  onDelete,
  onCheckUpdates,
}: AppsGridProps) {
  return (
    <div className="space-y-8 sm:space-y-12">
      {sortedCategories.map((category) => (
        <div key={category} className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-3xl font-semibold text-foreground">
              {category}
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {groupedApps[category].map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onEdit={onEdit}
                onDelete={onDelete}
                onCheckUpdates={onCheckUpdates}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
