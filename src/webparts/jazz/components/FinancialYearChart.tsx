/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  //   YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: any[];
}

const FinancialYearChart = ({ data }: Props): JSX.Element => {
  return (
    <div style={{ height: 300 }}>
      <h4>Financial Year</h4>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="Month" />
          {/* <YAxis /> */}
          <Tooltip />
          <Legend />
          <Bar dataKey="GrossExposure" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinancialYearChart;
