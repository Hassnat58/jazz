/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

const toMillions = (value: number) => value / 1_000_000;

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
    const taxType = item.TaxType;
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

    if (taxType === "Income Tax") {
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

  return Object.values(rows);
};
