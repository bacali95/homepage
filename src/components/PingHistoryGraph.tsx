import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PingHistory } from "../../generated/client/client";
import { pingStatusOf, type PingStatus } from "../lib/utils";

const UP = "var(--up)";
const DOWN = "var(--down)";
const WARN = "var(--warn)";
const STATUS_COLOR: Record<PingStatus, string> = {
  up: UP,
  down: DOWN,
  slow: WARN,
  unknown: "var(--line-strong)",
};
const AXIS_TICK = {
  fill: "var(--muted)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
} as const;

interface PingHistoryGraphProps {
  history: PingHistory[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      status: boolean;
      latency: number;
      time: number;
      statusCode?: number | null;
      errorMessage?: string | null;
    };
  }>;
}

// Custom tooltip
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const time = new Date(data.time).toLocaleTimeString();
    return (
      <div className="max-w-64 rounded-lg border border-line bg-raised p-2.5 text-xs shadow-lg">
        <p className="font-medium">
          {data.status ? (
            <span className="text-up">Up</span>
          ) : (
            <span className="text-down">Down</span>
          )}
        </p>
        <p className="mt-1 text-muted">
          Latency <span className="font-mono text-fg">{data.latency}ms</span>
        </p>
        <p className="text-muted">
          Time <span className="font-mono text-fg">{time}</span>
        </p>
        {!data.status && data.statusCode && (
          <p className="text-muted">
            Status <span className="font-mono text-fg">{data.statusCode}</span>
          </p>
        )}
        {!data.status && data.errorMessage && (
          <p className="text-muted break-words">Error {data.errorMessage}</p>
        )}
      </div>
    );
  }
  return null;
};

export function PingHistoryGraph({ history }: PingHistoryGraphProps) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    // Sort by time (oldest first for the chart)
    const sortedHistory = [...history].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return sortedHistory.map((entry) => {
      const time = new Date(entry.createdAt);
      return {
        time: time.getTime(),
        timeLabel: time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        latency: entry.responseTime ?? (entry.status ? 0 : 1000),
        status: entry.status,
        statusCode: entry.statusCode,
        errorMessage: entry.errorMessage,
        pingStatus: pingStatusOf({
          status: entry.status,
          responseTime: entry.responseTime,
        }),
      };
    });
  }, [history]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted">
        No data to display
      </div>
    );
  }

  // Y-axis runs from 0 to a little above the slowest up ping (at least 100ms).
  // Down pings are drawn full height so outages stand out regardless of latency.
  const maxUpLatency = Math.max(
    0,
    ...chartData.filter((d) => d.status).map((d) => d.latency)
  );
  const rawMax = Math.max(maxUpLatency, 100) * 1.1;
  const step = 10 ** Math.floor(Math.log10(rawMax)) / 2;
  const yMax = Math.ceil(rawMax / step) * step;
  const tickStep = yMax / step > 6 ? step * 2 : step;
  const yTicks = Array.from(
    { length: Math.floor(yMax / tickStep) + 1 },
    (_, i) => i * tickStep
  );

  const barData = chartData.map((point) => ({
    ...point,
    barValue: point.status ? point.latency : yMax,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barData}
          margin={{ top: 5, right: 28, left: 0, bottom: 0 }}
          barCategoryGap="15%"
        >
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="timeLabel"
            stroke="var(--line)"
            tick={AXIS_TICK}
            tickMargin={6}
            minTickGap={24}
          />
          <YAxis
            domain={[0, yMax]}
            ticks={yTicks}
            stroke="var(--line)"
            tick={AXIS_TICK}
            width={52}
            tickFormatter={(value: number) => `${Math.round(value)}ms`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--raised)" }}
          />
          <Bar
            dataKey="barValue"
            radius={[2, 2, 0, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          >
            {barData.map((point, index) => (
              <Cell key={index} fill={STATUS_COLOR[point.pingStatus]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
