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
} from "recharts";

const EntityExposureChart = ({ data }: { data: any[] }) => {
  const formatPKR = (value: number) => {
    if (!value) return "PKR 0";
    return `PKR ${Math.round(value / 1_000_000)}M`;
  };

  return (
    <div style={{ background: "#111", padding: "12px 14px", borderRadius: 12 }}>
      <h3 style={{ color: "#fff", marginBottom: 20, fontWeight: 500 }}>
        Entity wise gross tax exposure
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
          <YAxis stroke="#fff" tickFormatter={formatPKR} />
          <Tooltip formatter={(v: any) => formatPKR(v)} />

          <Bar dataKey="exposure" fill="#1f6f8b" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EntityExposureChart;
