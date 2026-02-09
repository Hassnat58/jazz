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
  LabelList,
  Legend,
} from "recharts";

const card: React.CSSProperties = {
  background: "#111",
  padding: "12px 14px",
  borderRadius: "12px",
  color: "#fff",
};

const COLORS: any = {
  "Gross Exposure": "#facc15", // cyan
  "Payment Under Protest": "#ff9800", // orange
  "Admitted Tax": "#e91e63", // pink
  "Cash Flow Exposure": "#4caf50", // green
};

const UTPSummaryGraph = ({ data }: { data: any[] }) => {
  // recharts needs each bar as separate dataKey → transform
  const chartData = [
    { name: "UTP", ...Object.fromEntries(data.map((d) => [d.label, d.value])) },
  ];
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

  return (
    <div style={card}>
      <h3 style={{ marginBottom: 20, fontWeight: 500 }}>
        UTP Summary (PKR Millions)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="name" stroke="#ccc" />
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

          <Legend verticalAlign="bottom" height={36} />

          {data.map((d: any) => (
            <Bar
              key={d.label}
              dataKey={d.label}
              fill={COLORS[d.label]}
              radius={[6, 6, 0, 0]}
            >
              <LabelList
                dataKey={d.label}
                position="top"
                fill="#fff"
                formatter={(v: any) => formatAmount(v)}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UTPSummaryGraph;
