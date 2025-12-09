import type { PingHistoryEntry } from "@/lib/api";
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

// Parse SQLite datetime string (UTC) to Date object
function parseSqliteDate(dateString: string): Date {
  if (
    dateString.includes("T") ||
    dateString.includes("Z") ||
    dateString.includes("+") ||
    dateString.includes("-", 10)
  ) {
    return new Date(dateString);
  }
  const isoString = dateString.replace(" ", "T") + "Z";
  return new Date(isoString);
}

interface PingHistoryGraphProps {
  history: PingHistoryEntry[];
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
  const color = payload.status ? "#22c55e" : "#ef4444"; // green-500 : red-500
  return (
    <Dot cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={2} />
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
      <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
        <p className="text-sm font-medium">
          {data.status ? (
            <span className="text-green-500">UP</span>
          ) : (
            <span className="text-red-500">DOWN</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Latency: {data.latency}ms
        </p>
        <p className="text-xs text-muted-foreground">Time: {time}</p>
        {!data.status && data.statusCode && (
          <p className="text-xs text-muted-foreground">
            Status Code: {data.statusCode}
          </p>
        )}
        {!data.status && data.errorMessage && (
          <p className="text-xs text-muted-foreground">
            Error: {data.errorMessage}
          </p>
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
        parseSqliteDate(a.created_at).getTime() -
        parseSqliteDate(b.created_at).getTime()
    );

    return sortedHistory.map((entry) => {
      const time = parseSqliteDate(entry.created_at);
      return {
        time: time.getTime(),
        timeLabel: time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        latency: entry.response_time ?? (entry.status ? 0 : 1000),
        status: entry.status,
        statusCode: entry.status_code,
        errorMessage: entry.error_message,
      };
    });
  }, [history]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
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
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartDataWithStatus}
          margin={{ top: 5, right: 20, left: -25, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            opacity={0.1}
          />
          <XAxis
            dataKey="timeLabel"
            stroke="currentColor"
            style={{ fontSize: "12px" }}
            tick={{ fill: "currentColor", opacity: 0.7 }}
          />
          <YAxis
            domain={yDomain}
            stroke="currentColor"
            style={{ fontSize: "12px" }}
            tick={{ fill: "currentColor", opacity: 0.7 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* UP status line - green */}
          <Line
            type="monotone"
            dataKey="upLatency"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: "#22c55e" }}
            connectNulls={true}
            isAnimationActive={false}
          />
          {/* DOWN status line - red */}
          <Line
            type="monotone"
            dataKey="downLatency"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: "#ef4444" }}
            connectNulls={true}
            isAnimationActive={false}
          />
          {/* Render all dots with custom colors */}
          <Line
            type="monotone"
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
