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
  Legend,
  ResponsiveContainer,
} from "recharts";

const formatBillions = (v: number) => `${v} B`;

const MonthlyExposureChart = ({ data }: { data: any[] }) => {
  return (
    <div style={{ background: "#111", padding: "12px 14px", borderRadius: 12 }}>
      <h3 style={{ color: "#fff", marginBottom: 20, fontWeight: 500 }}>
        Monthly Gross Exposure - PKR Billions
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.1)" />

          <XAxis dataKey="name" stroke="#fff" />
          <YAxis stroke="#fff" tickFormatter={formatBillions} />

          <Tooltip formatter={(v: any) => `${v} Billion PKR`} />

          <Legend wrapperStyle={{ color: "#fff" }} />

          <Bar
            dataKey="incomeTax"
            fill="#1f6f8b"
            radius={[6, 6, 0, 0]}
            name="Income Tax"
          />
          <Bar
            dataKey="salesTax"
            fill="#f4b400"
            radius={[6, 6, 0, 0]}
            name="Sales Tax"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyExposureChart;
