import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">No apps configured yet</h2>
        <p className="text-muted-foreground mb-6">
          Get started by adding your first homelab service
        </p>
        <Button
          onClick={onAdd}
          size="lg"
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add your first app
        </Button>
      </div>
    </div>
  );
}
