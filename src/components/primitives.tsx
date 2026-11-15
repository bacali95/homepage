import type { ComponentProps, ReactNode } from "react";

import { cn, type PingStatus } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface text-fg",
        className
      )}
      {...props}
    />
  );
}

const dotColor: Record<PingStatus, string> = {
  up: "bg-up",
  down: "bg-down",
  slow: "bg-warn",
  unknown: "bg-unknown",
};

export function StatusDot({
  status,
  className,
}: {
  status: PingStatus;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        dotColor[status],
        status === "down" && "ring-2 ring-down/25",
        className
      )}
    />
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        )}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse-soft rounded-md bg-raised", className)}
    />
  );
}

export function Mono({ className, ...props }: ComponentProps<"span">) {
  return (
    <span className={cn("font-mono tabular-nums", className)} {...props} />
  );
}
