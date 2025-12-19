/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import styles from "../components/AuthorityTable.module.scss";

interface IRow {
  authority: string;
  incomeTax: number;
  salesTax: number;
  total: number;
}

const AuthorityExposureTable: React.FC<{ data: IRow[] }> = ({ data }) => {
  const grandTotals = data.reduce(
    (sum, row) => {
      sum.incomeTax += row.incomeTax;
      sum.salesTax += row.salesTax;
      sum.total += row.total;
      return sum;
    },
    { incomeTax: 0, salesTax: 0, total: 0 }
  );

  const format = (value: number) =>
    `${value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })} Rs`;

  return (
    <div className={styles["table-container"]} style={{ gridColumn: "1 / -1" }}>
      <h4>Exposure by Pending Authority / Forum </h4>

      <table className={styles["dashboard-table"]}>
        <thead>
          <tr>
            <th>Pending Authority</th>
            <th>Income Tax</th>
            <th>Sales Tax</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.authority}>
              <td>{row.authority}</td>
              <td>{format(row.incomeTax)}</td>
              <td>{format(row.salesTax)}</td>
              <td>{format(row.total)}</td>
            </tr>
          ))}

          {/* TOTAL ROW */}
          <tr className={styles["total-row"]}>
            <td>Total</td>
            <td>{format(grandTotals.incomeTax)}</td>
            <td>{format(grandTotals.salesTax)}</td>
            <td>{format(grandTotals.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AuthorityExposureTable;
