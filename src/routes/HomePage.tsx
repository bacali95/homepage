import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppsGrid } from "@/components/AppsGrid";
import {
  createDeleteConfirm,
  DeleteAppDialog,
} from "@/components/DeleteAppDialog";
import { EmptyState } from "@/components/EmptyState";
import { AppsSkeleton } from "@/components/LoadingState";
import {
  createHistoryController,
  PingHistoryDialog,
} from "@/components/PingHistoryDialog";
import { SummaryStrip } from "@/components/SummaryStrip";
import {
  useApps,
  useAppsPingSummary,
  useCheckAppUpdates,
  useDeleteApp,
} from "@/lib/use-apps";
import { toast } from "@/lib/use-toast";
import { groupAppsByCategory, sortCategories } from "@/lib/utils";
import type { App } from "@/types";

export function HomePage() {
  const navigate = useNavigate();
  const { data: apps = [], isLoading: loadingApps } = useApps();
  const pings = useAppsPingSummary(apps);
  const deleteAppMutation = useDeleteApp();
  const checkAppUpdatesMutation = useCheckAppUpdates();
  const [confirmDelete] = useState(createDeleteConfirm);
  const [history] = useState(createHistoryController);

  const handleAdd = () => {
    navigate("/new");
  };

  const handleEdit = (app: App) => {
    navigate(`/${app.id}`);
  };

  const handleDelete = async (app: App) => {
    if (!(await confirmDelete({ id: app.id, name: app.name }))) return;
    try {
      await deleteAppMutation.mutateAsync(app.id);
      toast.success("App deleted successfully");
      document.getElementById("main")?.focus();
    } catch (error) {
      console.error("Error deleting app:", error);
      toast.error(
        "Error deleting app",
        error instanceof Error ? error.message : "Please try again."
      );
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

  const handleShowHistory = (app: App) => {
    history.open({ payload: { id: app.id, name: app.name } });
  };

  const groupedApps = groupAppsByCategory(apps);
  const sortedCategories = sortCategories(Object.keys(groupedApps));

  return (
    <>
      {loadingApps ? (
        <AppsSkeleton />
      ) : apps.length === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <div className="animate-fade-in">
          <SummaryStrip apps={apps} pings={pings} />
          <AppsGrid
            groupedApps={groupedApps}
            sortedCategories={sortedCategories}
            pings={pings}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCheckUpdates={handleCheckAppUpdates}
            onShowHistory={handleShowHistory}
          />
        </div>
      )}
      <DeleteAppDialog confirm={confirmDelete} />
      <PingHistoryDialog controller={history} />
    </>
  );
}
