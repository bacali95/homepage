import { useState } from "react";
import { Button } from "@ui-sdk/react/button";
import {
  createDialogController,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/react/dialog";
import { Activity, ChevronLeft, ChevronRight, X } from "lucide-react";

import { Mono, Skeleton } from "@/components/primitives";
import { PING_SUMMARY_PAGE_SIZE, useAppPingHistory } from "@/lib/use-apps";

import { PingHistoryGraph } from "./PingHistoryGraph";

export interface HistoryTarget {
  id: number;
  name: string;
}

export const createHistoryController = () =>
  createDialogController<HistoryTarget>();

function PingHistoryBody({ appId }: { appId: number }) {
  const [offset, setOffset] = useState(0);
  const {
    data: [history, total] = [[], 0],
    isLoading,
    isFetching,
  } = useAppPingHistory(appId, PING_SUMMARY_PAGE_SIZE, offset, true);

  const hasOlder = offset + PING_SUMMARY_PAGE_SIZE < total;
  const hasNewer = offset > 0;
  const hasData = history.length > 0;

  const up = history.filter((entry) => entry.status).length;
  const timed = history.filter((entry) => entry.responseTime != null);
  const average = timed.length
    ? Math.round(
        timed.reduce((sum, entry) => sum + (entry.responseTime ?? 0), 0) /
          timed.length
      )
    : null;

  if (isLoading && !hasData) {
    return <Skeleton className="h-72 w-full" />;
  }

  if (!hasData) {
    return (
      <div className="py-10 text-center text-muted">
        <Activity
          aria-hidden="true"
          className="mx-auto mb-3 size-8 opacity-60"
        />
        <p>No ping history available yet.</p>
        <p className="mt-1 text-xs">
          Pings will appear here once monitoring starts.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span>
          Uptime{" "}
          <Mono className="text-fg">
            {Math.round((up / history.length) * 100)}%
          </Mono>
        </span>
        {average !== null && (
          <span>
            Avg latency <Mono className="text-fg">{average}ms</Mono>
          </span>
        )}
      </div>
      <div className="relative">
        <PingHistoryGraph history={history} />
        {isFetching && (
          <div className="absolute inset-0 rounded-md bg-bg/60 backdrop-blur-[1px]" />
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs text-muted">
          Showing{" "}
          <Mono>
            {offset + 1}-{Math.min(offset + PING_SUMMARY_PAGE_SIZE, total)}
          </Mono>{" "}
          of <Mono>{total}</Mono> entries
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => setOffset(offset + PING_SUMMARY_PAGE_SIZE)}
            disabled={!hasOlder || isLoading}
          >
            <ChevronLeft aria-hidden="true" />
            Previous
          </Button>
          <Button
            onClick={() =>
              setOffset(Math.max(0, offset - PING_SUMMARY_PAGE_SIZE))
            }
            disabled={!hasNewer || isLoading}
          >
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );
}

export function PingHistoryDialog({
  controller,
}: {
  controller: ReturnType<typeof createHistoryController>;
}) {
  return (
    <Dialog controller={controller}>
      <DialogBackdrop />
      <DialogContent<HistoryTarget> className="w-[min(44rem,calc(100%-2rem))]">
        {(state) => (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold">
                  Ping history
                </DialogTitle>
                <DialogDescription className="truncate text-sm text-muted">
                  {state.payload?.name}
                </DialogDescription>
              </div>
              <DialogClose aria-label="Close ping history" data-variant="ghost">
                <X aria-hidden="true" />
              </DialogClose>
            </div>
            {state.payload && (
              <PingHistoryBody
                key={state.payload.id}
                appId={state.payload.id}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
