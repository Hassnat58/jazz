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
} from "recharts";

const renderAmountLabel = (formatAmount: any) => (props: any) => {
  const { x, y, width, value } = props;

  // allow 0, only skip null or undefined
  if (value === undefined || value === null) return null;

  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill="#fff"
      textAnchor="middle"
      fontSize={12}
      fontWeight={600}
    >
      {formatAmount(value)}
    </text>
  );
};
const getNiceStepDynamic = (max: number, targetTicks = 6) => {
  if (!max) return 1;
  const rawStep = max / targetTicks; // divide the max value into ~6 ticks
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep))); // e.g., 231M → 100M
  const residual = rawStep / magnitude;

  let niceResidual;
  if (residual <= 1) niceResidual = 1;
  else if (residual <= 2) niceResidual = 2;
  else if (residual <= 5) niceResidual = 5;
  else niceResidual = 10;

  return niceResidual * magnitude;
};

const EntityExposureChart = ({ data }: { data: any[] }) => {
  const formatAmount = (value: number) => {
    if (!value) return "0";

    const abs = Math.abs(value);
    const trunc = (v: number, unit: number) => Math.trunc(v / unit);

    if (abs >= 1_000_000_000_000) return `${trunc(value, 1_000_000_000_000)}T`;
    if (abs >= 1_000_000_000) return `${trunc(value, 1_000_000_000)}B`;
    return `${trunc(value, 1_000_000)}M`;
  };
  const maxValue = Math.max(...data.map((d) => d.exposure || 0));
  const step = getNiceStepDynamic(maxValue, 6);
  const topDomain = Math.ceil(maxValue / step) * step;

  const ticks: number[] = [];
  for (let i = 0; i <= topDomain; i += step) {
    ticks.push(i);
  }

  return (
    <div style={{ background: "#111", padding: "12px 14px", borderRadius: 12 }}>
      <h3 style={{ color: "#fff", marginBottom: 20, fontWeight: 500 }}>
        Entity wise gross tax exposure
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
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
            tickFormatter={formatAmount}
            domain={[0, ticks[ticks.length - 1]]}
            ticks={ticks}
          />
          <Tooltip cursor={false} content={() => null} />

          <Bar
            dataKey="exposure"
            fill="#1f6f8b"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          >
            <LabelList content={renderAmountLabel(formatAmount)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EntityExposureChart;
