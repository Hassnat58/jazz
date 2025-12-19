/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import styles from "../components/Dashboard.module.scss";

const RiskExposureTable: React.FC<{ data: any[] }> = ({ data }) => {
  const totals = data.reduce(
    (acc, row) => {
      acc.incomeTax += row.incomeTax;
      acc.salesTax += row.salesTax;
      acc.total += row.total;
      return acc;
    },
    { incomeTax: 0, salesTax: 0, total: 0 }
  );

  return (
    <div className={styles["graph-card"]}>
      <h4>Risk Level Exposure Summary</h4>

      <table className={styles["risk-table"]}>
        <thead>
          <tr>
            <th>Risk Level</th>
            <th>Income Tax Exposure</th>
            <th>Sales Tax Exposure</th>
            <th>Total Exposure</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.risk}>
              <td>{row.risk}</td>
              <td>{row.incomeTax.toLocaleString()}</td>
              <td>{row.salesTax.toLocaleString()}</td>
              <td>{row.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr>
            <td>
              <b>Total</b>
            </td>
            <td>
              <b>{totals.incomeTax.toLocaleString()}</b>
            </td>
            <td>
              <b>{totals.salesTax.toLocaleString()}</b>
            </td>
            <td>
              <b>{totals.total.toLocaleString()}</b>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default RiskExposureTable;
