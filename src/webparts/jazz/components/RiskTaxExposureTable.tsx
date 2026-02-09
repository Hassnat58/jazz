/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#0b0b0b",
  color: "#fff",
  fontSize: "14px",

};

const thTd: React.CSSProperties = {
  border: "1px solid #333",
  padding: "10px",
  textAlign: "right",
};

const leftCell: React.CSSProperties = {
  ...thTd,
  textAlign: "left",
  fontWeight: 600,
};

const format = (val: number) => val.toLocaleString("en-PK");

const RiskTaxExposureTable = ({ data }: { data: any }) => {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={leftCell}>Total Exposure (PKR Mn)</th>
          <th style={thTd}>Probable</th>
          <th style={thTd}>Possible</th>
          <th style={thTd}>Remote</th>
          <th style={thTd}>Total</th>
        </tr>
      </thead>
      <tbody>
        {["Income Tax", "Sales Tax"].map((tax) => (
          <tr key={tax}>
            <td style={leftCell}>{tax}</td>
            <td style={thTd}>{format(data[tax].Probable)}</td>
            <td style={thTd}>{format(data[tax].Possible)}</td>
            <td style={thTd}>{format(data[tax].Remote)}</td>
            <td style={thTd}>{format(data[tax].Total)}</td>
          </tr>
        ))}

        <tr style={{ fontWeight: 700, background: "#111" }}>
          <td style={leftCell}>Total</td>
          <td style={thTd}>{format(data.Total.Probable)}</td>
          <td style={thTd}>{format(data.Total.Possible)}</td>
          <td style={thTd}>{format(data.Total.Remote)}</td>
          <td style={thTd}>{format(data.Total.Total)}</td>
        </tr>
      </tbody>
    </table>
  );
};

export default RiskTaxExposureTable;
