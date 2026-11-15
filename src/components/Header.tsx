import { Button } from "@ui-sdk/react/button";
import { Plus, RefreshCw, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useCheckUpdates } from "@/lib/use-apps";
import { toast } from "@/lib/use-toast";

import { CommandPalette } from "./CommandPalette";

export function Header() {
  const location = useLocation();
  const checkUpdatesMutation = useCheckUpdates();
  const isSettings = location.pathname.startsWith("/settings");

  const handleCheckUpdates = async () => {
    try {
      await checkUpdatesMutation.mutateAsync();
      toast.success("Updates checked successfully");
    } catch (error) {
      console.error("Error checking updates:", error);
      toast.error(
        "Error checking for updates",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center gap-2 px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight transition-opacity duration-150 hover:opacity-80"
        >
          <img src="/favicon.svg" alt="" className="size-6 shrink-0" />
          Homepage
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <CommandPalette onCheckUpdates={handleCheckUpdates} />
          <Button
            aria-label="Check for updates"
            data-variant="ghost"
            disabled={checkUpdatesMutation.isPending}
            onClick={handleCheckUpdates}
          >
            <RefreshCw
              aria-hidden="true"
              className={checkUpdatesMutation.isPending ? "animate-spin" : ""}
            />
          </Button>
          <Button
            aria-label="Settings"
            data-variant="ghost"
            aria-current={isSettings ? "page" : undefined}
            render={<Link to="/settings" />}
          >
            <Settings aria-hidden="true" />
          </Button>
          <Button data-variant="solid" render={<Link to="/new" />}>
            <Plus aria-hidden="true" />
            <span className="max-sm:sr-only">Add app</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
