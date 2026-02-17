/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";

const th: React.CSSProperties = {
  border: "1px solid #333",
  background: "#facc15",
  color: "#fff",
  padding: "10px",
  textAlign: "center",
  fontWeight: 600,
};

const td: React.CSSProperties = {
  border: "1px solid #333",
  padding: "10px",
  textAlign: "right",
  color: "#fff",
};

const leftTd: React.CSSProperties = {
  ...td,
  textAlign: "left",
  fontWeight: 600,
};

const formatMillions = (val: number) =>
  val.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ForumSummaryTable = ({ data }: { data: any[] }) => {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        color: "#fff",
        backgroundColor: "#0b0b0b",
      }}
    >
      <thead>
        <tr>
          <th rowSpan={2} style={th}>
            Forum
          </th>
          <th colSpan={3} style={th}>
            No of cases
          </th>
          <th colSpan={3} style={th}>
            Gross Exposure
            <br />
            PKR Millions
          </th>
        </tr>
        <tr>
          <th style={th}>Income Tax</th>
          <th style={th}>Sales Tax</th>
          <th style={th}>Total</th>
          <th style={th}>Income Tax</th>
          <th style={th}>Sales Tax</th>
          <th style={th}>Total</th>
        </tr>
      </thead>

      <tbody>
        {data.map((row) => {
          const isTotal = row.forum === "Total";

          return (
            <tr
              key={row.forum}
              style={isTotal ? { fontWeight: 700, background: "#111" } : {}}
            >
              <td style={leftTd}>{row.forum}</td>

              <td style={td}>{row.cases.income}</td>
              <td style={td}>{row.cases.sales}</td>
              <td style={td}>{row.cases.total}</td>

              <td style={td}>{formatMillions(row.exposure.income)}</td>
              <td style={td}>{formatMillions(row.exposure.sales)}</td>
              <td style={td}>{formatMillions(row.exposure.total)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ForumSummaryTable;
