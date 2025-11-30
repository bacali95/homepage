import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useExportApps,
  useImportApps as useImportAppsHelper,
} from "@/lib/use-export-import";
import { useApps, useImportApps } from "@/lib/use-apps";
import { toast } from "@/lib/use-toast";
import { Download, Upload } from "lucide-react";

export function BackupSettingsContent() {
  const { data: apps = [] } = useApps();
  const importAppsMutation = useImportApps();
  const importAppsHelper = useImportAppsHelper();
  const exportApps = useExportApps();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      exportApps(apps);
      toast.success("Apps exported successfully");
    } catch (error) {
      console.error("Error exporting apps:", error);
      toast.error(
        "Failed to export apps",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { validApps, errors } = await importAppsHelper(file);

      if (validApps.length === 0) {
        toast.error(
          "No valid apps to import",
          errors.length > 0 ? errors.join(", ") : undefined
        );
        return;
      }

      const confirmed = confirm(
        `This will import ${validApps.length} app(s). ${
          errors.length > 0 ? `\n\nWarnings:\n${errors.join("\n")}` : ""
        }\n\nDo you want to continue?`
      );

      if (!confirmed) {
        return;
      }

      const result = await importAppsMutation.mutateAsync(validApps);

      if (result.success) {
        const details: string[] = [];
        if (result.created > 0) {
          details.push(`${result.created} created`);
        }
        if (result.updated > 0) {
          details.push(`${result.updated} updated`);
        }
        const detailMessage =
          details.length > 0 ? ` (${details.join(", ")})` : "";

        toast.success(
          `Successfully imported ${result.imported} app(s)${detailMessage}`,
          result.errors && result.errors.length > 0
            ? `Some errors occurred: ${result.errors.join(", ")}`
            : undefined
        );
      } else {
        toast.error(
          "Failed to import apps",
          "Please check the console for details."
        );
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error importing apps:", error);
      toast.error(
        "Failed to import apps",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          Backup & Restore
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Export your apps as a backup file or import apps from a backup
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Export Backup</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Download all your apps as a JSON backup file. This file can be
                used to restore your apps on another instance or as a backup.
              </p>
              <Button onClick={handleExport} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export Backup
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Import Backup</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Import apps from a backup JSON file. This will create new apps
                or update existing ones based on the backup data.
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importAppsMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Upload
                  className={`mr-2 h-4 w-4 ${
                    importAppsMutation.isPending ? "animate-pulse" : ""
                  }`}
                />
                {importAppsMutation.isPending
                  ? "Importing..."
                  : "Import Backup"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file-input"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
