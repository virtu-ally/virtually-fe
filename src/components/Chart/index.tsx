import "./index.css";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartData {
  day: string;
  completions: number;
  color: string;
}

interface ChartProps {
  data: ChartData[];
  title: string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg p-3 shadow-lg border"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
          backdropFilter: "blur(8px)",
          color: "var(--chart-tooltip-text, var(--text-color))",
        }}
      >
        <p
          className="text-sm font-medium"
          style={{ color: "var(--chart-tooltip-text, var(--text-color))" }}
        >
          Day {label}
        </p>
        <p
          className="text-sm"
          style={{
            color: "var(--chart-tooltip-text, var(--text-color))",
            opacity: 0.8,
          }}
        >
          <span
            className="inline-block w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: "var(--accent-color)" }}
          ></span>
          {payload[0].value} completion{payload[0].value !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }
  return null;
};

const Chart = ({ data, title, height = 250 }: ChartProps) => {
  return (
    <div
      className="chart-container mt-6 rounded-xl p-6 shadow-lg"
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        boxShadow: "0 10px 25px var(--card-shadow)",
        color: "var(--text-color)",
      }}
    >
      <h3
        className="text-lg font-semibold mb-4 text-center"
        style={{ color: "var(--chart-text-color)" }}
      >
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <defs>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--chart-accent-color)"
                stopOpacity={0.9}
              />
              <stop
                offset="95%"
                stopColor="var(--chart-accent-light)"
                stopOpacity={0.3}
              />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--chart-text-color)" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--chart-text-color)" }}
            allowDecimals={false}
          />
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--chart-grid-color)"
            opacity={0.6}
          />
          <Tooltip
            content={<CustomTooltip />}
            contentStyle={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "8px",
              backdropFilter: "blur(8px)",
              color: "var(--text-color)",
              boxShadow: "0 4px 12px var(--card-shadow)",
            }}
          />
          <Area
            type="monotone"
            dataKey="completions"
            stroke="var(--chart-accent-color)"
            strokeWidth={3}
            fill="url(#progressGradient)"
            animationDuration={1200}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
