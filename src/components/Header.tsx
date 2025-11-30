import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Settings } from "lucide-react";
import { SettingsMenu } from "./SettingsMenu";
import { useCheckUpdates } from "@/lib/use-apps";
import { toast } from "@/lib/use-toast";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const checkUpdatesMutation = useCheckUpdates();

  const isHomePage = location.pathname === "/";
  const isSettingsPage = location.pathname.startsWith("/settings");

  const handleAdd = () => {
    navigate("/new");
  };

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
    <div className="mb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6">
        <div className="flex items-start gap-3">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="/favicon.svg"
              alt="Homepage"
              className="h-16 w-16 shrink-0 mt-1"
            />
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-linear-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                Homepage
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage and monitor your self-hosted applications
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <nav className="flex items-center gap-3">
            <Link to="/">
              <Button
                variant={isHomePage ? "default" : "ghost"}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <Home className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            <Link to="/settings">
              <Button
                variant={isSettingsPage ? "default" : "ghost"}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <Settings className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
          </nav>
          <SettingsMenu
            onAdd={handleAdd}
            onCheckUpdates={handleCheckUpdates}
            isCheckingUpdates={checkUpdatesMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
