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
  LabelList,
} from "recharts";

const formatAmount = (value: number) => {
  if (!value) return "0";

  const abs = Math.abs(value);
  const trunc = (v: number, unit: number) => Math.trunc(v / unit);

  if (abs >= 1_000_000_000_000) return `${trunc(value, 1_000_000_000_000)}T`;
  if (abs >= 1_000_000_000) return `${trunc(value, 1_000_000_000)}B`;
  return `${trunc(value, 1_000_000)}M`;
};

const getNiceStep = (max: number) => {
  const B = 1_000_000_000;

  if (max <= 50 * B) return 5 * B;
  if (max <= 150 * B) return 10 * B;
  if (max <= 300 * B) return 25 * B;
  if (max <= 700 * B) return 50 * B;
  return 100 * B;
};

const MonthlyExposureChart = ({ data }: { data: any[] }) => {
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.incomeTax || 0, d.salesTax || 0)),
  );

  const step = getNiceStep(maxValue);

  const axisMax = Math.ceil(maxValue / step) * step * 1.1;

  const ticks: number[] = [];
  for (let i = 0; i <= axisMax; i += step) ticks.push(i);

  return (
    <div style={{ background: "#111", padding: "12px 14px", borderRadius: 12 }}>
      <h3 style={{ color: "#fff", marginBottom: 20, fontWeight: 500 }}>
        Monthly Gross Exposure - PKR Billions
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.1)" />

          <XAxis dataKey="name" stroke="#fff" />
          <YAxis
            stroke="#ccc"
            ticks={ticks}
            domain={[0, axisMax]}
            tickFormatter={formatAmount}
          />

          <Tooltip cursor={false} content={() => null} />

          <Legend wrapperStyle={{ color: "#fff" }} />

          <Bar
            dataKey="incomeTax"
            fill="#1f6f8b"
            radius={[6, 6, 0, 0]}
            name="Income Tax"
            isAnimationActive={false}
          >
            <LabelList
              position="top"
              formatter={(v: number) => formatAmount(v)}
              fill="#fff"
            />
          </Bar>

          <Bar
            dataKey="salesTax"
            fill="#f4b400"
            radius={[6, 6, 0, 0]}
            name="Sales Tax"
            isAnimationActive={false}
          >
            <LabelList
              position="top"
              formatter={(v: number) => formatAmount(v)}
              fill="#fff"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyExposureChart;
