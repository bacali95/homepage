import { useId } from "react";
import { Button } from "@ui-sdk/react/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@ui-sdk/react/menu";
import {
  ArrowUpRight,
  Layers,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
  Waypoints,
} from "lucide-react";

import { Mono, StatusDot } from "@/components/primitives";
import { Sparkline } from "@/components/Sparkline";
import {
  cn,
  formatVersion,
  parseRunningConfig,
  pingStatusOf,
  type PingStatus,
} from "@/lib/utils";
import type { App } from "@/types";

import type { PingHistory } from "../../generated/client/client";

interface AppCardProps {
  app: App;
  ping?: [PingHistory[], number];
  onEdit: (app: App) => void;
  onDelete: (app: App) => void;
  onCheckUpdates: (app: App) => void;
  onShowHistory: (app: App) => void;
}

const statusLabel: Record<PingStatus, string> = {
  up: "Up",
  down: "Down",
  slow: "Slow",
  unknown: "Pending",
};

const statusText: Record<PingStatus, string> = {
  up: "text-fg",
  down: "text-down",
  slow: "text-fg",
  unknown: "text-muted",
};

function AppIcon({ app }: { app: App }) {
  if (app.icon) {
    return (
      <img
        src={app.icon}
        alt=""
        loading="lazy"
        className="size-9 shrink-0 rounded-lg border border-line bg-raised object-contain p-1"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-raised text-sm font-semibold text-muted uppercase"
    >
      {app.name.slice(0, 1)}
    </span>
  );
}

export function AppCard({
  app,
  ping,
  onEdit,
  onDelete,
  onCheckUpdates,
  onShowHistory,
}: AppCardProps) {
  const { dockerImage, k8sNamespace } = parseRunningConfig(
    app.versionPreferences?.runningConfig
  );
  const version = app.versionPreferences;
  const history = ping?.[0] ?? [];
  const latest = history[0];
  const status = pingStatusOf(latest);
  const pingEnabled = app.pingPreferences?.enabled;
  const detailsId = useId();

  const body = (
    <>
      <div className="flex items-center gap-3">
        <AppIcon app={app} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-[0.9375rem] leading-tight font-medium">
              {app.name}
            </h3>
            {app.url && (
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5 shrink-0 text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
              />
            )}
          </div>
          {(k8sNamespace || dockerImage) && (
            <p className="mt-0.5 flex items-center gap-2 font-mono text-[0.6875rem] leading-tight text-muted">
              {k8sNamespace && (
                <span className="flex max-w-[45%] shrink-0 items-center gap-1 truncate">
                  <Layers aria-hidden="true" className="size-3 shrink-0" />
                  <span className="truncate">{k8sNamespace}</span>
                </span>
              )}
              {dockerImage && <span className="truncate">{dockerImage}</span>}
            </p>
          )}
        </div>
      </div>
      {version?.enabled && (
        <div
          id={detailsId}
          className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs"
        >
          <Mono className={version.currentVersion ? "text-fg" : "text-muted"}>
            {version.currentVersion
              ? formatVersion(version.currentVersion)
              : "version unknown"}
          </Mono>
          {version.hasUpdate && version.latestVersion && (
            <Mono className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[0.6875rem] font-medium text-accent">
              update → {formatVersion(version.latestVersion)}
            </Mono>
          )}
        </div>
      )}
    </>
  );

  const bodyClass =
    "block rounded-t-card p-3 pr-11 outline-offset-[-2px] focus-visible:outline-2";

  return (
    <article className="group relative flex flex-col rounded-card border border-line bg-surface transition-colors duration-150 hover:border-line-strong">
      {app.url ? (
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={app.name}
          aria-describedby={version?.enabled ? detailsId : undefined}
          className={bodyClass}
        >
          {body}
        </a>
      ) : (
        <div className={bodyClass}>{body}</div>
      )}

      <div className="mt-auto flex min-h-9 items-center justify-between gap-2 border-t border-line px-3 py-1.5 text-xs">
        {pingEnabled ? (
          <Button
            data-variant="ghost"
            onClick={() => onShowHistory(app)}
            className="-mx-1.5 h-auto min-w-0 flex-1 justify-start gap-2 px-1.5 py-1 text-xs font-normal"
          >
            <StatusDot
              status={status}
              className={cn(status === "unknown" && "animate-pulse-soft")}
            />
            <span className={cn("font-medium", statusText[status])}>
              {statusLabel[status]}
            </span>
            {latest?.responseTime != null && (
              <Mono className="text-muted">{latest.responseTime}ms</Mono>
            )}
            <span className="sr-only">ping history for {app.name}</span>
            <Sparkline history={history} className="ml-auto" />
          </Button>
        ) : (
          <span className="flex items-center gap-2 text-muted">
            <StatusDot status="unknown" />
            Not monitored
          </span>
        )}
      </div>

      <Menu>
        <MenuTrigger
          aria-label={`Actions for ${app.name}`}
          data-variant="ghost"
          className="absolute top-2 right-2 size-7"
        >
          <MoreHorizontal aria-hidden="true" />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem onSelect={() => onEdit(app)}>
            <Pencil aria-hidden="true" />
            Edit
          </MenuItem>
          {version?.enabled && (
            <MenuItem onSelect={() => onCheckUpdates(app)}>
              <RefreshCw aria-hidden="true" />
              Check updates
            </MenuItem>
          )}
          {pingEnabled && (
            <MenuItem onSelect={() => onShowHistory(app)}>
              <Waypoints aria-hidden="true" />
              Ping history
            </MenuItem>
          )}
          <MenuItem onSelect={() => onDelete(app)} className="text-down">
            <Trash2 aria-hidden="true" />
            Delete
          </MenuItem>
        </MenuContent>
      </Menu>
    </article>
  );
}
