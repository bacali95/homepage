import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandItemIcon,
  CommandItemText,
  CommandList,
  type CommandData,
  type CommandDataItem,
} from "@ui-sdk/react/command";
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogShortcut,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react/dialog";
import {
  ArrowUpRight,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useApps } from "@/lib/use-apps";
import { useTheme } from "@/lib/use-theme";
import type { App } from "@/types";

interface CommandPaletteProps {
  onCheckUpdates: () => void;
}

function Commands({
  items,
  apps,
  dark,
}: {
  items: CommandData;
  apps: Map<string, App>;
  dark: boolean;
}) {
  const actionIcons: Record<string, React.ReactNode> = {
    "action:add": <Plus />,
    "action:check-updates": <RefreshCw />,
    "action:settings": <Settings />,
    "action:theme": dark ? <Sun /> : <Moon />,
  };

  return items.map((entry) => {
    if (typeof entry !== "string" && "type" in entry) {
      if (entry.type === "separator") return null;
      return (
        <CommandGroup key={entry.label}>
          <CommandGroupLabel>{entry.label}</CommandGroupLabel>
          <Commands items={entry.items} apps={apps} dark={dark} />
        </CommandGroup>
      );
    }
    const command: CommandDataItem =
      typeof entry === "string" ? { value: entry, label: entry } : entry;
    const app = apps.get(command.value);
    return (
      <CommandItem
        key={command.value}
        value={command.value}
        label={command.label}
        keywords={command.keywords}
      >
        <CommandItemIcon>
          {app ? (
            app.icon ? (
              <img src={app.icon} alt="" className="size-4 object-contain" />
            ) : (
              <span className="text-xs font-semibold uppercase">
                {app.name.slice(0, 1)}
              </span>
            )
          ) : (
            actionIcons[command.value]
          )}
        </CommandItemIcon>
        <CommandItemText className="truncate">{command.label}</CommandItemText>
        {app && (
          <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted">
            {app.category}
            {app.url && <ArrowUpRight aria-hidden="true" className="size-3" />}
          </span>
        )}
      </CommandItem>
    );
  });
}

export function CommandPalette({ onCheckUpdates }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: apps = [] } = useApps();
  const { resolvedTheme, setTheme } = useTheme();

  const byValue = new Map(apps.map((app) => [`app:${app.id}`, app]));

  const items: CommandData = [
    {
      type: "group",
      label: "Actions",
      items: [
        { value: "action:add", label: "Add app", keywords: ["new", "create"] },
        {
          value: "action:check-updates",
          label: "Check all updates",
          keywords: ["refresh", "versions"],
        },
        {
          value: "action:settings",
          label: "Settings",
          keywords: ["preferences", "notifications"],
        },
        {
          value: "action:theme",
          label: "Toggle theme",
          keywords: ["dark", "light", "appearance"],
        },
      ],
    },
    {
      type: "group",
      label: "Apps",
      items: apps.map((app) => ({
        value: `app:${app.id}`,
        label: app.name,
        keywords: [app.category, app.url ?? ""].filter(Boolean),
      })),
    },
  ];

  const run = (value: string) => {
    setOpen(false);
    if (value === "action:add") navigate("/new");
    else if (value === "action:check-updates") onCheckUpdates();
    else if (value === "action:settings") navigate("/settings");
    else if (value === "action:theme")
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    else {
      const app = byValue.get(value);
      if (!app) return;
      if (app.url) window.open(app.url, "_blank", "noopener,noreferrer");
      else navigate(`/${app.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        shortcut="mod+k"
        className="md:w-64 md:justify-start md:text-muted"
      >
        <Search aria-hidden="true" />
        <span className="max-md:sr-only">Search apps and actions</span>
        <DialogShortcut
          aria-hidden="true"
          className="ml-auto hidden rounded border border-line px-1 font-mono text-[0.6875rem] md:inline"
        />
      </DialogTrigger>
      <DialogBackdrop />
      <DialogContent className="mt-[10vh] mb-auto w-[min(36rem,calc(100%-2rem))] gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command
          items={items}
          onAction={run}
          className="w-full rounded-none border-0"
        >
          <div className="flex items-center gap-2 border-b-2 border-line px-3 focus-within:border-accent">
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted" />
            <CommandInput
              aria-label="Search commands"
              placeholder="Search apps, run an action…"
              className="h-11 flex-1 border-0 bg-transparent px-0 focus-visible:outline-none"
            />
          </div>
          <CommandEmpty>
            <p className="px-4 py-6 text-center text-sm text-muted">
              No results found.
            </p>
          </CommandEmpty>
          <CommandList className="max-h-[min(24rem,60dvh)] overflow-y-auto p-1.5">
            {(state) => (
              <Commands
                items={state.items}
                apps={byValue}
                dark={resolvedTheme === "dark"}
              />
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
