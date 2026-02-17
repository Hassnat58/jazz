/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";

const renderLabel = (props: any) => {
  const { x, y, width, value } = props;

  if (value === undefined || value === null) return null;

  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill="#fff"
      textAnchor="middle"
      fontSize={12}
      fontWeight={500}
    >
      {value}
    </text>
  );
};
const getNiceStep = (max: number) => {
  if (max <= 20) return 2;
  if (max <= 50) return 5;
  if (max <= 100) return 10;
  if (max <= 300) return 20;
  if (max <= 700) return 50;
  if (max <= 1500) return 100;
  return 200;
};
const getMaxValue = (data: any[]) => {
  let max = 0;

  data.forEach((d) => {
    max = Math.max(max, d["Income Tax Cases"] || 0, d["Sales Tax Cases"] || 0);
  });

  return max;
};

const ForumWiseCasesChart = ({ data }: { data: any[] }) => {
  const maxValue = getMaxValue(data);
  const topDomain = Math.ceil(maxValue * 1.2); // 20% headroom
  const step = getNiceStep(maxValue);

  const ticks: number[] = [];
  for (let i = 0; i <= topDomain; i += step) {
    ticks.push(i);
  }
  return (
    <div style={{ background: "#111", padding: "12px 14px", borderRadius: 12 }}>
      <h3 style={{ color: "#fff", marginBottom: 20, fontWeight: 500 }}>
        Forum wise number of cases
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 25, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.1)" />

          <XAxis
            dataKey="name"
            stroke="#fff"
            angle={-40}
            textAnchor="end"
            interval={0}
            height={90}
          />

          <YAxis
            stroke="#fff"
            allowDecimals={false}
            domain={[0, ticks[ticks.length - 1]]}
            ticks={ticks}
          />

          <Legend />

          <Bar
            dataKey="Income Tax Cases"
            fill="#1f6f8b"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          >
            <LabelList content={renderLabel} />
          </Bar>

          <Bar
            dataKey="Sales Tax Cases"
            fill="#f4b400"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          >
            <LabelList content={renderLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForumWiseCasesChart;
