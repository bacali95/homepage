import { type App } from "@/lib/api";
import { AppCard } from "@/components/AppCard";

interface AppsGridProps {
  groupedApps: Record<string, App[]>;
  sortedCategories: string[];
  editMode: boolean;
  onEdit: (app: App) => void;
  onDelete: (id: number) => void;
}

export function AppsGrid({
  groupedApps,
  sortedCategories,
  editMode,
  onEdit,
  onDelete,
}: AppsGridProps) {
  return (
    <div className="space-y-12">
      {sortedCategories.map((category) => (
        <div key={category} className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
              {category}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {groupedApps[category].map((app) => (
              <AppCard
                key={app.id}
                app={app}
                editMode={editMode}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
