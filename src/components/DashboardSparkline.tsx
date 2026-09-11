import React, { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

export interface SparklinePoint {
  value: number;
}

interface DashboardSparklineProps {
  data: number[] | SparklinePoint[];
  color?: string;
  gradientId: string;
  className?: string;
}

export function DashboardSparkline({
  data,
  color = "hsl(var(--primary))",
  gradientId,
  className = "",
}: DashboardSparklineProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Fallback a una línea plana estética si no hay datos
      return Array.from({ length: 7 }, () => ({ value: 10 }));
    }

    return data.map((item) => {
      if (typeof item === "number") {
        return { value: item };
      }
      return { value: item.value };
    });
  }, [data]);

  return (
    <div className={`w-full h-full overflow-hidden pointer-events-none ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={true}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
