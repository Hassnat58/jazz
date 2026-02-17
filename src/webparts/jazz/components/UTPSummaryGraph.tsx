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

const getNiceStep = (max: number) => {
  const billion = 1_000_000_000;

  if (max >= 800 * billion) return 100 * billion;
  if (max >= 400 * billion) return 50 * billion;
  if (max >= 200 * billion) return 25 * billion;
  if (max >= 100 * billion) return 20 * billion;
  if (max >= 50 * billion) return 10 * billion;
  if (max >= 10 * billion) return 5 * billion;

  return 1 * billion;
};

const UTPSummaryGraph = ({ data }: { data: any[] }) => {
  // recharts needs each bar as separate dataKey → transform
  const chartData = [
    { name: "UTP", ...Object.fromEntries(data.map((d) => [d.label, d.value])) },
  ];
  const formatAmount = (value: number) => {
    if (!value) return "0";

    const abs = Math.abs(value);

    const truncate = (v: number, unit: number) => Math.trunc(v / unit); // <- key fix

    if (abs >= 1_000_000_000_000) {
      return `${truncate(value, 1_000_000_000_000)}T`;
    }

    if (abs >= 1_000_000_000) {
      return `${truncate(value, 1_000_000_000)}B`;
    }

    return `${truncate(value, 1_000_000)}M`;
  };

  const maxValue = Math.max(...data.map((d) => d.value));
  const step = getNiceStep(maxValue);

  // build ticks manually
  const ticks = [];
  for (let i = 0; i <= maxValue * 1.15; i += step) {
    ticks.push(i);
  }
  const topDomain = ticks[ticks.length - 1] + step * 0.6;

  return (
    <div style={card}>
      <h3 style={{ marginBottom: 20, fontWeight: 500 }}>
        UTP Summary (PKR Millions)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="name" stroke="#ccc" />
          <YAxis
            stroke="#ccc"
            allowDecimals={false}
            ticks={ticks}
            domain={[0, topDomain]}
            tickFormatter={(v) => formatAmount(v)}
          />

          {/* <Tooltip
            formatter={(value: any) => [`PKR ${formatAmount(value)}`, ""]}
            labelFormatter={() => ""}
          /> */}
          <Tooltip
            cursor={false}
            content={() => null}
            wrapperStyle={{ display: "none" }}
          />

          <Legend verticalAlign="bottom" height={36} />

          {data.map((d: any) => (
            <Bar
              key={d.label}
              dataKey={d.label}
              fill={COLORS[d.label]}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
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
