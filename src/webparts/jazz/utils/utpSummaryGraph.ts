/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

// const toMillions = (n: number) => Math.floor(n / 1_000_000);

/** Latest approved version per UTPId */
const getLatestApprovedUTPs = (utpData: any[], toDate: Date) => {
  const map: any = {};

  const target = new Date(
    Date.UTC(toDate.getFullYear(), toDate.getMonth() + 1, 0, 23, 59, 59, 999),
  );

  utpData.forEach((item) => {
    if (item.ApprovalStatus?.toLowerCase() !== "approved") return;
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

    // ✅ THIS IS THE KEY FIX
    if (utcDate > target) return;

    const key = item.UTPId;

    const isLater = (a: any, b: any) => {
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

/** Aggregate payments by type */
// const getIssueAmountsByUTP = (utpIssues: any[]) => {
//   const map: any = {};

//   utpIssues.forEach((issue) => {
//     const id = issue.UTP?.Id;
//     if (!id) return;

//     if (!map[id]) {
//       map[id] = { protest: 0, admitted: 0 };
//     }

//     const amount = Number(issue.Amount || 0);
//     const type = (issue.PaymentType || "").toLowerCase();

//     if (type.includes("protest")) {
//       map[id].protest += amount;
//     } else if (type.includes("admitted")) {
//       map[id].admitted += amount;
//     }
//   });

//   return map;
// };

/** FINAL GRAPH DATA */
export const buildUTPSummaryGraph = (
  utpData: any[],
  utpIssues: any[],
  toDate: Date,
) => {
  const utps = getLatestApprovedUTPs(utpData, toDate);

  const approvedIds = new Set(utps.map((u: any) => u.Id));

  let gross = 0;
  let protest = 0;
  let admitted = 0;

  utpIssues.forEach((issue) => {
    if (!approvedIds.has(issue.UTP?.Id)) return;

    const exposure = Number(issue.GrossTaxExposure || 0);
    const amount = Number(issue.Amount || 0);
    const type = (issue.PaymentType || "").toLowerCase();

    gross += exposure;

    if (type.includes("protest")) {
      protest += amount;
    } else if (type.includes("admitted")) {
      admitted += amount;
    }
  });

  const cashflow = gross - protest;

  return [
    { label: "Gross Exposure", value: gross },
    { label: "Payment Under Protest", value: protest },
    { label: "Admitted Tax", value: admitted },
    { label: "Cash Flow Exposure", value: cashflow },
  ];
};
