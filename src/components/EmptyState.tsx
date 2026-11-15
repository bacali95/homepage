import { Button } from "@ui-sdk/react/button";
import { LayoutGrid, Plus } from "lucide-react";

import { Card } from "@/components/primitives";

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <Card className="mx-auto mt-10 flex max-w-md flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-line bg-raised text-muted">
        <LayoutGrid aria-hidden="true" className="size-5" />
      </div>
      <h2 className="text-base font-semibold">No apps configured yet</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Add your first homelab service to track its status and updates.
      </p>
      <Button data-variant="solid" onClick={onAdd}>
        <Plus aria-hidden="true" />
        Add your first app
      </Button>
    </Card>
  );
}
