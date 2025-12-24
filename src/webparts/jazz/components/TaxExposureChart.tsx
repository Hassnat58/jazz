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

const toPercent = (decimal: number, fixed = 0) =>
  `${(decimal * 100).toFixed(fixed)}%`;

const TaxExposureChart: React.FC<{ data: any[] }> = ({ data }) => {
  // 🔹 Calculate totals
  const totalIncomeTax = data.reduce((sum, d) => sum + (d.IncomeTax || 0), 0);

  const totalSalesTax = data.reduce((sum, d) => sum + (d.SalesTax || 0), 0);

  return (
    <div style={{ height: 360 }}>
      <h4>Taxes Exposure</h4>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} stackOffset="expand">
          <XAxis dataKey="Month" />
          <YAxis tickFormatter={(v) => toPercent(v)} />
          <Tooltip
            formatter={(value: number, name: string) => [
              value,
              name === "IncomeTax" ? "Income Tax" : "Sales Tax",
            ]}
          />

          {/* ✅ Custom legend with totals */}
          <Legend
            formatter={(value) => {
              if (value === "IncomeTax") {
                return `Income Tax (${totalIncomeTax.toLocaleString()})`;
              }
              if (value === "SalesTax") {
                return `Sales Tax (${totalSalesTax.toLocaleString()})`;
              }
              return value;
            }}
          />

          <Bar
            dataKey="IncomeTax"
            stackId="a"
            fill="#1d4ed8"
            name="IncomeTax"
          />
          <Bar dataKey="SalesTax" stackId="a" fill="#60a5fa" name="SalesTax" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaxExposureChart;
