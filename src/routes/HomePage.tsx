import { useNavigate } from "react-router-dom";
import { type App } from "@/lib/api";
import { groupAppsByCategory, sortCategories } from "@/lib/utils";
import { useApps, useDeleteApp, useCheckAppUpdates } from "@/lib/use-apps";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { AppsGrid } from "@/components/AppsGrid";
import { toast } from "@/lib/use-toast";

export function HomePage() {
  const navigate = useNavigate();
  const { data: apps = [], isLoading: loadingApps } = useApps();
  const deleteAppMutation = useDeleteApp();
  const checkAppUpdatesMutation = useCheckAppUpdates();

  const loading = loadingApps;

  const handleAdd = () => {
    navigate("/new");
  };

  const handleEdit = (app: App) => {
    navigate(`/${app.id}`);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this app?")) {
      try {
        await deleteAppMutation.mutateAsync(id);
        toast.success("App deleted successfully");
      } catch (error) {
        console.error("Error deleting app:", error);
        toast.error(
          "Error deleting app",
          error instanceof Error ? error.message : "Please try again."
        );
      }
    }
  };

  const handleCheckAppUpdates = async (app: App) => {
    try {
      await checkAppUpdatesMutation.mutateAsync(app.id);
      toast.success(
        "Update check completed",
        `Checked for updates for ${app.name}`
      );
    } catch (error) {
      console.error("Error checking updates:", error);
      toast.error(
        "Error checking updates",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const groupedApps = groupAppsByCategory(apps);
  const sortedCategories = sortCategories(Object.keys(groupedApps));

  return (
    <div>
      {apps.length === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <AppsGrid
          groupedApps={groupedApps}
          sortedCategories={sortedCategories}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCheckUpdates={handleCheckAppUpdates}
        />
      )}
    </div>
  );
}
