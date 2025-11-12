import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, Trash2, Edit } from "lucide-react";
import { type App } from "@/lib/api";
import { formatVersion, getSourceTypeLabel } from "@/lib/utils";

interface AppCardProps {
  app: App;
  editMode: boolean;
  onEdit: (app: App) => void;
  onDelete: (id: number) => void;
}

export function AppCard({ app, editMode, onEdit, onDelete }: AppCardProps) {
  return (
    <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col border-border/50 hover:border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl font-semibold truncate mb-2 group-hover:text-primary transition-colors">
              {app.name}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm space-y-1">
              {app.url && (
                <span className="truncate block text-muted-foreground/80">
                  {app.url}
                </span>
              )}
              <span className="truncate block text-muted-foreground/70">
                {app.repo}
              </span>
              <span className="inline-block">
                <Badge variant="secondary" className="text-xs font-normal">
                  {getSourceTypeLabel(app.source_type)}
                </Badge>
              </span>
            </CardDescription>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {editMode && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(app)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(app.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {!editMode && app.has_update && (
              <Badge
                variant="destructive"
                className="flex items-center gap-1 text-xs animate-pulse"
              >
                <AlertCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Update Available</span>
                <span className="sm:hidden">Update</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end pt-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs font-mono">
              {formatVersion(app.current_version)}
            </Badge>
            {app.has_update && app.latest_version && (
              <>
                <span className="text-muted-foreground/60 hidden sm:inline text-xs">
                  →
                </span>
                <Badge variant="destructive" className="text-xs font-mono">
                  <span className="hidden sm:inline">
                    {formatVersion(app.latest_version)}
                  </span>
                  <span className="sm:hidden">
                    {formatVersion(app.latest_version)}
                  </span>
                </Badge>
              </>
            )}
          </div>
          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110"
            >
              <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0 h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
