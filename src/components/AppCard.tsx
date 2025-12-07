import type { App } from "@/lib/api";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Box,
  CheckCircle2,
  Edit,
  ExternalLink,
  Layers,
  MoreVertical,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { api } from "@/lib/api";
import { formatVersion, truncateText } from "@/lib/utils";

import { PingHistoryDialog } from "./PingHistoryDialog";

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
  const [pingHistoryOpen, setPingHistoryOpen] = useState(false);

  const { data: pingStatus } = useQuery({
    queryKey: ["ping-status", app.id],
    queryFn: () => api.getPingStatus(app.id),
    enabled: app.ping_enabled,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleClick = () => {
    if (app.url) {
      window.open(app.url, "_blank", "noopener,noreferrer");
    }
  };

  const handlePingStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (app.ping_enabled) {
      setPingHistoryOpen(true);
    }
  };

  return (
    <>
      <Card
        className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col hover:border-border cursor-pointer"
        onClick={handleClick}
      >
        <CardHeader className="shrink-0 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {app.icon && (
                  <img
                    src={app.icon}
                    alt={`${app.name} icon`}
                    className="w-14 h-14 rounded-lg object-contain bg-background/50 p-1 border border-border/50"
                  />
                )}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg sm:text-xl font-semibold truncate group-hover:text-primary transition-colors">
                      {app.name}
                    </CardTitle>
                    {app.ping_enabled && (
                      <button
                        onClick={handlePingStatusClick}
                        className="shrink-0 p-1 rounded hover:bg-accent transition-colors"
                        title="Click to view ping history"
                      >
                        {pingStatus?.status === true ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : pingStatus?.status === false ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
                        )}
                      </button>
                    )}
                  </div>
                  {app.category && (
                    <Badge
                      variant="outline"
                      className="text-xs font-normal w-fit"
                    >
                      {app.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
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
                {app.current_version && (
                  <MenuItem onClick={() => onCheckUpdates(app)}>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <span>Check for Updates</span>
                    </div>
                  </MenuItem>
                )}
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
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                <span className="truncate">{truncateText(app.url, 50)}</span>
              </div>
            )}
            {app.docker_image && (
              <div className="flex items-center gap-1.5 truncate">
                <Box className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                <span className="truncate">
                  {truncateText(app.docker_image, 40)}
                </span>
              </div>
            )}
            {app.k8s_namespace && (
              <div className="flex items-center gap-1.5 truncate">
                <Layers className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                <span className="truncate">Namespace: {app.k8s_namespace}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between gap-2 w-full">
            {app.current_version && (
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
            )}
            {app.url && (
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110 shrink-0 ml-auto"
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
      {app.ping_enabled && (
        <PingHistoryDialog
          appId={app.id}
          appName={app.name}
          open={pingHistoryOpen}
          onOpenChange={setPingHistoryOpen}
        />
      )}
    </>
  );
}
