import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { api, type App } from "@/lib/api";
import { useState, useRef } from "react";

interface BackupRestoreProps {
  onImportComplete?: () => void | Promise<void>;
}

export function BackupRestore({ onImportComplete }: BackupRestoreProps) {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const apps = await api.exportApps();

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
      alert("Failed to export apps. Please try again.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
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
        if (!app.repo && !app.github_repo) {
          errors.push(`App "${app.name}": Missing repo or github_repo`);
          return false;
        }
        return true;
      });

      if (validApps.length === 0) {
        alert(`No valid apps to import. Errors:\n${errors.join("\n")}`);
        return;
      }

      // Show confirmation dialog
      const confirmed = confirm(
        `This will import ${validApps.length} app(s). ${
          errors.length > 0 ? `\n\nWarnings:\n${errors.join("\n")}` : ""
        }\n\nDo you want to continue?`
      );

      if (!confirmed) {
        return;
      }

      // Import apps
      const result = await api.importApps(validApps);

      if (result.success) {
        alert(
          `Successfully imported ${result.imported} app(s).${
            result.errors && result.errors.length > 0
              ? `\n\nErrors:\n${result.errors.join("\n")}`
              : ""
          }`
        );
        if (onImportComplete) {
          await onImportComplete();
        }
      } else {
        alert("Failed to import apps. Please check the console for details.");
      }
    } catch (error) {
      console.error("Error importing apps:", error);
      if (error instanceof SyntaxError) {
        alert("Invalid JSON file. Please check the file format.");
      } else {
        alert(
          `Failed to import apps: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
        id="import-file-input"
      />
      <Button
        onClick={handleExport}
        variant="outline"
        className="shadow-sm hover:shadow-md transition-shadow"
        title="Export all apps as JSON backup"
      >
        <Download className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </Button>
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        disabled={importing}
        className="shadow-sm hover:shadow-md transition-shadow"
        title="Import apps from JSON backup"
      >
        <Upload
          className={`mr-2 h-4 w-4 ${importing ? "animate-pulse" : ""}`}
        />
        <span className="hidden sm:inline">
          {importing ? "Importing..." : "Import"}
        </span>
        <span className="sm:hidden">{importing ? "..." : "Import"}</span>
      </Button>
    </div>
  );
}
