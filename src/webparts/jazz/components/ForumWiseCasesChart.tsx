/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const ForumWiseCasesChart = ({ data }: { data: any[] }) => {
  return (
    <div style={{ background: "#111", padding: "12px 14px", borderRadius: 12 }}>
      <h3 style={{ color: "#fff", marginBottom: 20, fontWeight: 500 }}>
        Forum wise number of cases
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="name"
            stroke="#fff"
            angle={-70}
            textAnchor="end"
            interval={0}
            height={120}
          />
          <YAxis stroke="#fff" />
          <Tooltip />
          <Legend />

          <Bar
            dataKey="Income Tax Cases"
            fill="#1f6f8b"
            radius={[6, 6, 0, 0]}
          />
          <Bar dataKey="Sales Tax Cases" fill="#f4b400" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForumWiseCasesChart;
