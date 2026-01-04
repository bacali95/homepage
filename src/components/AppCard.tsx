import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { useAppPingStatus } from "@/lib/use-apps";
import { formatVersion, truncateText } from "@/lib/utils";
import type { App } from "@/types";

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

  const { data: pingStatus } = useAppPingStatus(app.id);

  const { dockerImage, k8sNamespace } = JSON.parse(
    app.versionPreferences?.runningConfig || "{}"
  ) as {
    dockerImage?: string;
    k8sNamespace?: string;
  };

  const handleClick = () => {
    if (app.url) {
      window.open(app.url, "_blank", "noopener,noreferrer");
    }
  };

  const handlePingStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (app.pingPreferences?.enabled) {
      setPingHistoryOpen(true);
    }
  };

  return (
    <>
      <Card
        className="group sm:hover:shadow-xl sm:hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col sm:hover:border-border cursor-pointer"
        onClick={handleClick}
      >
        <CardHeader className="shrink-0 p-3 pb-2 sm:p-5 sm:pb-3">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                {app.icon && (
                  <img
                    src={app.icon}
                    alt={`${app.name} icon`}
                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg object-contain bg-background/50 p-0.5 sm:p-1 border border-border/50"
                  />
                )}
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  <div className="flex items-center gap-1">
                    <CardTitle className="text-base sm:text-xl font-semibold truncate sm:group-hover:text-primary transition-colors text-wrap text-center sm:text-left">
                      {app.name}
                    </CardTitle>
                    {app.pingPreferences?.enabled && (
                      <button
                        onClick={handlePingStatusClick}
                        className="shrink-0 p-0.5 sm:p-1 rounded sm:hover:bg-accent transition-colors hidden sm:block"
                        title="Click to view ping history"
                      >
                        {pingStatus?.status === true ? (
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                        ) : pingStatus?.status === false ? (
                          <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                        ) : (
                          <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground animate-pulse" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 w-full">
                    {app.versionPreferences?.enabled && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] sm:text-xs font-mono px-1.5 py-0.5 sm:px-2 sm:py-0.5 hidden sm:flex"
                        >
                          {formatVersion(app.versionPreferences.currentVersion)}
                        </Badge>
                        {app.versionPreferences.hasUpdate &&
                          app.versionPreferences.latestVersion && (
                            <>
                              <span className="text-muted-foreground/60 text-xs">
                                →
                              </span>
                              <Badge
                                variant="destructive"
                                className="text-[10px] sm:text-xs font-mono px-1.5 py-0.5 sm:px-2 sm:py-0.5"
                              >
                                {formatVersion(
                                  app.versionPreferences.latestVersion
                                )}
                              </Badge>
                            </>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex-col items-end gap-2 hidden sm:flex">
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
                {app.versionPreferences?.enabled && (
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
        <CardContent className="hidden sm:flex flex-1 flex-col space-y-3 justify-between p-5 pt-0">
          <div className="space-y-2 text-xs text-muted-foreground/80">
            {app.url && (
              <div className="flex items-center gap-1.5 truncate">
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                <span className="truncate">{truncateText(app.url, 50)}</span>
              </div>
            )}
            {dockerImage && (
              <div className="flex items-center gap-1.5 truncate">
                <Box className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                <span className="truncate">
                  {truncateText(dockerImage, 40)}
                </span>
              </div>
            )}
            {k8sNamespace && (
              <div className="flex items-center gap-1.5 truncate">
                <Layers className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                <span className="truncate">Namespace: {k8sNamespace}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {app.pingPreferences?.enabled && (
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
