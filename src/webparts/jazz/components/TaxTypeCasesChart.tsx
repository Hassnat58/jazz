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

const COLORS: any = {
  "Income Tax": "#1f6f8b",
  "Sales Tax": "#f4b400",
};

const TaxTypeCasesChart = ({ data }: { data: any[] }) => {
  return (
    <div style={{ background: "#111", padding: "12px 14px", borderRadius: 12 }}>
      <h3 style={{ color: "#fff", marginBottom: 20, fontWeight: 500 }}>
        Tax type wise number of cases
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="#333" vertical={false} />
          <XAxis dataKey="name" stroke="#ccc" />
          <YAxis allowDecimals={false} stroke="#ccc" />

          <Tooltip
            contentStyle={{ background: "#222", border: "none", color: "#fff" }}
            formatter={(v: any) => [`${v} cases`, ""]}
          />

          <Legend wrapperStyle={{ color: "#fff" }} verticalAlign="bottom" />

          <Bar
            dataKey="Income Tax"
            fill={COLORS["Income Tax"]}
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="Sales Tax"
            fill={COLORS["Sales Tax"]}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaxTypeCasesChart;
