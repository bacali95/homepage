import { useMemo } from "react";
import {
  CartesianGrid,
  Dot,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PingHistory } from "../../generated/client/client";

const UP = "var(--up)";
const DOWN = "var(--down)";
const AXIS_TICK = {
  fill: "var(--muted)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
} as const;

interface PingHistoryGraphProps {
  history: PingHistory[];
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: {
    status: boolean;
    latency: number;
    timeLabel: string;
    statusCode?: number | null;
    errorMessage?: string | null;
  };
}

// Custom dot component that changes color based on status
const CustomDot = ({ cx, cy, payload }: CustomDotProps) => {
  if (!cx || !cy || !payload) return null;
  const color = payload.status ? UP : DOWN;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={3.5}
      fill={color}
      stroke="var(--surface)"
      strokeWidth={2}
    />
  );
};

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

  // Calculate domain for Y-axis (latency)
  const latencies = chartData.map((d) => d.latency);
  const maxLatency = Math.max(...latencies, 100);
  const minLatency = Math.min(...latencies, 0);
  const yDomain = [Math.max(0, minLatency - 10), maxLatency + 10];

  // Prepare data with separate latency values for UP and DOWN
  // Include transition points in both lines to connect them
  const chartDataWithStatus = chartData.map((point, index) => {
    const prevPoint = index > 0 ? chartData[index - 1] : null;
    const isTransition = prevPoint && prevPoint.status !== point.status;

    return {
      ...point,
      // For UP points: include latency, also include if it's a transition from DOWN
      upLatency: point.status
        ? point.latency
        : isTransition
          ? point.latency
          : null,
      // For DOWN points: include latency, also include if it's a transition from UP
      downLatency: !point.status
        ? point.latency
        : isTransition
          ? point.latency
          : null,
    };
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartDataWithStatus}
          margin={{ top: 5, right: 28, left: 0, bottom: 0 }}
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
            domain={yDomain}
            stroke="var(--line)"
            tick={AXIS_TICK}
            width={52}
            tickFormatter={(value: number) => `${Math.round(value)}ms`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "var(--line-strong)" }}
          />
          {/* UP status line */}
          <Line
            type="linear"
            dataKey="upLatency"
            stroke={UP}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: UP }}
            connectNulls={true}
            isAnimationActive={false}
          />
          {/* DOWN status line */}
          <Line
            type="linear"
            dataKey="downLatency"
            stroke={DOWN}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: DOWN }}
            connectNulls={true}
            isAnimationActive={false}
          />
          {/* Render all dots with custom colors */}
          <Line
            type="linear"
            dataKey="latency"
            stroke="transparent"
            strokeWidth={0}
            dot={<CustomDot />}
            activeDot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
