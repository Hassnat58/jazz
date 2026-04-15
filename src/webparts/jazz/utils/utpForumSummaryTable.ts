/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

const getLatestApprovedUTPs = (utpData: any[], toDate: Date) => {
  const map: any = {};

  const target = new Date(
    Date.UTC(toDate.getFullYear(), toDate.getMonth() + 1, 0, 23, 59, 59, 999),
  );

  utpData.forEach((item) => {
    if (item.ApprovalStatus !== "Approved") return;
    if (!item.UTPId || !item.UTPDate) return;

    const d = new Date(item.UTPDate);
    const utcDate = new Date(
      Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds(),
        d.getUTCMilliseconds(),
      ),
    );

    if (utcDate > target) return;

    const key = item.UTPId;

    const isLater = (a: any, b: any) => {
      if (!a) return true;

      const ad = new Date(a.UTPDate);
      const bd = new Date(b.UTPDate);

      if (bd > ad) return true;
      if (bd.getTime() === ad.getTime()) return b.Id > a.Id;

      return false;
    };

    if (!map[key] || isLater(map[key], item)) {
      map[key] = item;
    }
  });

  return Object.values(map);
};

// Normalize tax type
const normalizeTaxType = (type?: string): string => {
  if (!type) return "Unknown";
  const t = type.trim().toLowerCase();
  if (t === "income tax") return "Income Tax";
  if (t === "sales tax") return "Sales Tax";
  return type;
};

export const buildForumSummaryTable = (utpData: any[], toDate: Date) => {
  const approvedUTPs = getLatestApprovedUTPs(utpData, toDate);

  const rows: any = {};

  approvedUTPs.forEach((item: any) => {
    const forum = item.CaseNumber?.PendingAuthority || "Unknown";
    const taxType = normalizeTaxType(item.TaxType);
    const exposure = Number(item.GrossExposure || 0); // keep RAW

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

  // Calculate totals (NO rounding here)
  Object.values(rows).forEach((row: any) => {
    row.cases.total = row.cases.income + row.cases.sales;
    row.exposure.total = row.exposure.income + row.exposure.sales;
  });

  const result = Object.values(rows);

  // GRAND TOTAL (still RAW values)
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
