import { cn, pingStatusOf } from "@/lib/utils";

import type { PingHistory } from "../../generated/client/client";

const tickColor = {
  up: "bg-up",
  down: "bg-down",
  slow: "bg-warn",
  unknown: "bg-unknown",
} as const;

export function Sparkline({
  history,
  className,
}: {
  history: PingHistory[];
  className?: string;
}) {
  const ticks = [...history].reverse();

  return (
    <span
      aria-hidden="true"
      className={cn("flex h-4 items-stretch gap-[2px]", className)}
    >
      {ticks.map((entry) => (
        <span
          key={entry.id}
          className={cn(
            "w-[3px] rounded-[1px]",
            tickColor[pingStatusOf(entry)]
          )}
        />
      ))}
    </span>
  );
}
