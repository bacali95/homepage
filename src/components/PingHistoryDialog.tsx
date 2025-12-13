import { useEffect, useRef, useState } from "react";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";

import { useAppPingHistory } from "@/lib/use-apps";

import { LoadingState } from "./LoadingState";
import { PingHistoryGraph } from "./PingHistoryGraph";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";

interface PingHistoryDialogProps {
  appId: number;
  appName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE = 20;

export function PingHistoryDialog({
  appId,
  appName,
  open,
  onOpenChange,
}: PingHistoryDialogProps) {
  const [offset, setOffset] = useState(0);
  const prevOpenRef = useRef(open);

  const {
    data: [history, total] = [[], 0],
    isLoading,
    isFetching,
  } = useAppPingHistory(appId, PAGE_SIZE, offset);

  const hasMore = offset + PAGE_SIZE < total;
  const hasPrevious = offset > 0;
  const hasData = history.length > 0;

  const handleNext = () => {
    if (hasPrevious) {
      setOffset(Math.max(0, offset - PAGE_SIZE));
    }
  };

  const handlePrevious = () => {
    if (hasMore) {
      setOffset(offset + PAGE_SIZE);
    }
  };

  // Reset offset when dialog opens (transitions from closed to open)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOffset(0);
    }
    prevOpenRef.current = open;
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Ping History - ${appName}`}
    >
      <div className="p-4">
        {isLoading && !hasData ? (
          <LoadingState />
        ) : !hasData && !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No ping history available yet.</p>
            <p className="text-sm mt-2">
              Pings will appear here once monitoring starts.
            </p>
          </div>
        ) : (
          <>
            <div className="relative">
              {hasData && <PingHistoryGraph history={history} />}
              {isFetching && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </div>
              )}
            </div>
            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of{" "}
                {total} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!hasMore || isLoading}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!hasPrevious || isLoading}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
