import { type App } from "./api";

export function useExportApps() {
  return (apps: App[]) => {
    try {
      // Remove database-specific fields for export
      const exportData = apps.map((app) => {
        const {
          id,
          created_at,
          updated_at,
          latest_version,
          has_update,
          ...exportApp
        } = app;
        return exportApp;
      });

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `homepage-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting apps:", error);
      throw new Error("Failed to export apps. Please try again.");
    }
  };
}

export function useImportApps() {
  return async (
    file: File
  ): Promise<{
    validApps: Omit<
      App,
      "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
    >[];
    errors: string[];
  }> => {
    try {
      const fileContent = await file.text();
      const apps = JSON.parse(fileContent) as Omit<
        App,
        "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
      >[];

      if (!Array.isArray(apps)) {
        throw new Error(
          "Invalid backup file format. Expected an array of apps."
        );
      }

      // Validate apps
      const errors: string[] = [];
      const validApps = apps.filter((app, index) => {
        if (!app.name) {
          errors.push(`App at index ${index}: Missing name`);
          return false;
        }
        if (!app.current_version) {
          errors.push(`App "${app.name}": Missing current_version`);
          return false;
        }
        if (!app.repo) {
          errors.push(`App "${app.name}": Missing repo`);
          return false;
        }
        if (!app.category || typeof app.category !== "string") {
          errors.push(
            `App "${app.name}": category is required and must be a string`
          );
          return false;
        }
        if (!app.docker_image || typeof app.docker_image !== "string") {
          errors.push(
            `App "${app.name}": docker_image is required and must be a string`
          );
          return false;
        }
        if (!app.k8s_namespace || typeof app.k8s_namespace !== "string") {
          errors.push(
            `App "${app.name}": k8s_namespace is required and must be a string`
          );
          return false;
        }
        return true;
      });

      return { validApps, errors };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("Invalid JSON file. Please check the file format.");
      }
      throw error;
    }
  };
}
