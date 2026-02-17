/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

const toMillions = (value: number) => value / 1_000_000;
const normalizeTaxType = (type?: string): string => {
  if (!type) return "Unknown";
  const t = type.trim().toLowerCase();
  if (t === "income tax") return "Income Tax";
  if (t === "sales tax") return "Sales Tax";
  return type; // keep others as-is
};
export const buildForumSummaryTable = (utpData: any[]) => {
  // latest approved per UTPId
  const latestMap: any = {};

  utpData.forEach((item) => {
    if (item.ApprovalStatus?.toLowerCase() !== "approved") return;
    if (!item.UTPId) return;

    if (!latestMap[item.UTPId] || item.Id > latestMap[item.UTPId].Id) {
      latestMap[item.UTPId] = item;
    }
  });

  const rows: any = {};

  Object.values(latestMap).forEach((item: any) => {
    const forum = item.CaseNumber?.PendingAuthority || "Unknown";
    const taxType = normalizeTaxType(item.TaxType);
    const exposure = Number(item.GrossExposure || 0);

    if (!rows[forum]) {
      rows[forum] = {
        forum,
        cases: {
          income: 0,
          sales: 0,
          total: 0,
        },
        exposure: {
          income: 0,
          sales: 0,
          total: 0,
        },
      };
    }

    if (taxType === "Income Tax" || taxType === "Income tax") {
      rows[forum].cases.income += 1;
      rows[forum].exposure.income += exposure;
    }

    if (taxType === "Sales Tax") {
      rows[forum].cases.sales += 1;
      rows[forum].exposure.sales += exposure;
    }
  });

  // calculate totals + convert exposure to millions
  Object.values(rows).forEach((row: any) => {
    row.cases.total = row.cases.income + row.cases.sales;

    row.exposure.total = row.exposure.income + row.exposure.sales;

    row.exposure.income = Number(toMillions(row.exposure.income).toFixed(2));
    row.exposure.sales = Number(toMillions(row.exposure.sales).toFixed(2));
    row.exposure.total = Number(toMillions(row.exposure.total).toFixed(2));
  });

  const result = Object.values(rows);

  // 🔴 GRAND TOTAL
  const totalRow = {
    forum: "Total",
    cases: { income: 0, sales: 0, total: 0 },
    exposure: { income: 0, sales: 0, total: 0 },
  };

  result.forEach((r: any) => {
    totalRow.cases.income += r.cases.income;
    totalRow.cases.sales += r.cases.sales;
    totalRow.cases.total += r.cases.total;

    totalRow.exposure.income += r.exposure.income;
    totalRow.exposure.sales += r.exposure.sales;
    totalRow.exposure.total += r.exposure.total;
  });

  result.push(totalRow);

  return result;
};
