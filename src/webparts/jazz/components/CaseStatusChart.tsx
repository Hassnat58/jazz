/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Approved: "#10b981",
  Rejected: "#ef4444",
  Pending: "#f59e0b",
  Draft: "#3b82f6",
};

const CaseStatusChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div style={{ height: 320 }}>
    <h4>Case Status Summary</h4>

    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          innerRadius={70}
          outerRadius={100}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.status] || "#94a3b8"}
            />
          ))}
        </Pie>

        <Tooltip />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default CaseStatusChart;
