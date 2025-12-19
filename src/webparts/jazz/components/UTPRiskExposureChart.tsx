/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const UtpRiskExposureChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div style={{ height: 340 }}>
    <h4>Total Amount by Category</h4>

    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="Month" />
        <Tooltip />
        <Legend />
        <Bar dataKey="Possible" fill="#2563eb" />
        <Bar dataKey="Probable" fill="#f59e0b" />
        <Bar dataKey="Remote" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default UtpRiskExposureChart;
