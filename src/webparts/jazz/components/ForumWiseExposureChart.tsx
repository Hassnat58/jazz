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

const COLORS = {
  "Income Tax Exposure": "#1f6f8b",
  "Sales Tax Exposure": "#f4b400",
};

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

const ForumWiseExposureChart = ({ data }: { data: any[] }) => {
  const maxValue = Math.max(
    ...data.flatMap((d) => [
      d["Income Tax Exposure"] || 0,
      d["Sales Tax Exposure"] || 0,
    ]),
  );

  const step = getNiceStep(maxValue);
  const axisMax = Math.ceil(maxValue / step) * step * 1.1;

  const ticks: number[] = [];
  for (let i = 0; i <= axisMax; i += step) ticks.push(i);

  return (
    <div style={{ background: "#111", padding: "12px 14px", borderRadius: 12 }}>
      <h3 style={{ color: "#fff", marginBottom: 16, fontWeight: 500 }}>
        Forum wise exposure – PKR Millions
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="#333" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#fff"
            angle={-40}
            textAnchor="end"
            interval={0}
            height={90}
          />
          <YAxis
            stroke="#ccc"
            ticks={ticks}
            domain={[0, axisMax]}
            tickFormatter={formatAmount}
          />

          <Tooltip cursor={false} content={() => null} />

          <Legend verticalAlign="bottom" wrapperStyle={{ color: "#fff" }} />

          <Bar
            dataKey="Income Tax Exposure"
            fill={COLORS["Income Tax Exposure"]}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="Income Tax Exposure"
              position="top"
              fill="#fff"
              formatter={(v: any) => formatAmount(v)}
            />
          </Bar>
          <Bar
            dataKey="Sales Tax Exposure"
            fill={COLORS["Sales Tax Exposure"]}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="Sales Tax Exposure"
              position="top"
              fill="#fff"
              formatter={(v: any) => formatAmount(v)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForumWiseExposureChart;
