import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import {
  ExternalLink,
  AlertCircle,
  Trash2,
  Edit,
  MoreVertical,
  RefreshCw,
  Layers,
  Box,
} from "lucide-react";
import { type App } from "@/lib/api";
import { formatVersion, truncateText } from "@/lib/utils";

interface AppCardProps {
  app: App;
  onEdit: (app: App) => void;
  onDelete: (id: number) => void;
  onCheckUpdates: (app: App) => void;
}

export function AppCard({
  app,
  onEdit,
  onDelete,
  onCheckUpdates,
}: AppCardProps) {
  return (
    <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col border-border/50 hover:border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl font-semibold truncate group-hover:text-primary transition-colors">
                {app.name}
              </CardTitle>
              {app.category && (
                <Badge
                  variant="outline"
                  className="text-xs font-normal flex-shrink-0"
                >
                  {app.category}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {app.has_update && (
              <Badge
                variant="destructive"
                className="flex items-center gap-1 text-xs animate-pulse"
              >
                <AlertCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Update Available</span>
                <span className="sm:hidden">Update</span>
              </Badge>
            )}
            <Menu
              trigger={
                <MenuTrigger>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </MenuTrigger>
              }
              align="right"
            >
              <MenuItem onClick={() => onEdit(app)}>
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </div>
              </MenuItem>
              <MenuItem onClick={() => onCheckUpdates(app)}>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Check for Updates</span>
                </div>
              </MenuItem>
              <MenuItem
                onClick={() => onDelete(app.id)}
                className="text-destructive focus:text-destructive"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </div>
              </MenuItem>
            </Menu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-3 justify-between">
        <div className="space-y-2 text-xs text-muted-foreground/80">
          {app.url && (
            <div className="flex items-center gap-1.5 truncate">
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground/60" />
              <span className="truncate">{truncateText(app.url, 50)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 truncate">
            <Box className="h-3 w-3 flex-shrink-0 text-muted-foreground/60" />
            <span className="truncate">
              {truncateText(app.docker_image, 40)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Layers className="h-3 w-3 flex-shrink-0 text-muted-foreground/60" />
            <span className="truncate">Namespace: {app.k8s_namespace}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 flex-wrap h-8">
            <Badge variant="outline" className="text-xs font-mono">
              {formatVersion(app.current_version)}
            </Badge>
            {app.has_update && app.latest_version && (
              <>
                <span className="text-muted-foreground/60 text-xs">→</span>
                <Badge variant="destructive" className="text-xs font-mono">
                  {formatVersion(app.latest_version)}
                </Badge>
              </>
            )}
          </div>
          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110 flex-shrink-0"
            >
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
