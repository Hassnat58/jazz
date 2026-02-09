/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  "Income Tax Exposure": "#1f6f8b",
  "Sales Tax Exposure": "#f4b400",
};

const formatAmount = (value: number) => {
  if (value === 0) return "0";

  const abs = Math.abs(value);

  if (abs >= 1_000_000_000_000) {
    return `${Number((value / 1_000_000_000_000).toPrecision(2))}T`;
  }

  if (abs >= 1_000_000_000) {
    return `${Number((value / 1_000_000_000).toPrecision(2))}B`;
  }

  return `${Number((value / 1_000_000).toPrecision(2))}M`;
};
const ForumWiseExposureChart = ({ data }: { data: any[] }) => {
  return (
    <div style={{ background: "#111", padding: "12px 14px", borderRadius: 12 }}>
      <h3 style={{ color: "#fff", marginBottom: 16, fontWeight: 500 }}>
        Forum wise exposure – PKR Millions
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="#333" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#fff"
            angle={-70}
            textAnchor="end"
            interval={0}
            height={120}
          />
          <YAxis
            stroke="#ccc"
            allowDecimals={false}
            tickCount={6}
            domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
            tickFormatter={(v) => formatAmount(v)}
          />

          <Tooltip
            formatter={(value: any) => [`PKR ${formatAmount(value)}`, ""]}
            labelFormatter={() => ""}
          />

          <Legend verticalAlign="bottom" wrapperStyle={{ color: "#fff" }} />

          <Bar
            dataKey="Income Tax Exposure"
            fill={COLORS["Income Tax Exposure"]}
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="Sales Tax Exposure"
            fill={COLORS["Sales Tax Exposure"]}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForumWiseExposureChart;
