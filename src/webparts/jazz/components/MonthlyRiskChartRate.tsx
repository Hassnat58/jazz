/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const percentFormatter = (value: number) => `${(value * 100).toFixed(0)}%`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#fff",
        padding: 10,
        border: "1px solid #e5e7eb",
      }}
    >
      <strong>{label}</strong>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {p.value.toLocaleString()} Rs
        </div>
      ))}
    </div>
  );
};

const MonthlyRiskRateChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div style={{ height: 360 }}>
    <h4>Monthly Exposure Breakdown</h4>

    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} stackOffset="expand">
        <XAxis dataKey="Month" />
        <YAxis tickFormatter={percentFormatter} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />

        {/* Gradients */}
        <defs>
          <linearGradient id="possibleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          <linearGradient id="probableGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <linearGradient id="remoteGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        <Bar
          dataKey="Possible"
          stackId="a"
          fill="url(#possibleGrad)"
          name="Possible"
        />
        <Bar
          dataKey="Probable"
          stackId="a"
          fill="url(#probableGrad)"
          name="Probable"
        />
        <Bar
          dataKey="Remote"
          stackId="a"
          fill="url(#remoteGrad)"
          name="Remote"
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default MonthlyRiskRateChart;
