/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

// const toMillions = (n: number) => Math.floor(n / 1_000_000);

/** Latest approved version per UTPId */
const getLatestApprovedUTPs = (utpData: any[]) => {
  const map: any = {};

  utpData.forEach((item) => {
    if (item.ApprovalStatus?.toLowerCase() !== "approved") return;
    if (!item.UTPId) return;

    if (!map[item.UTPId] || item.Id > map[item.UTPId].Id) {
      map[item.UTPId] = item;
    }
  });

  return Object.values(map);
};

/** Aggregate payments by type */
const getIssueAmountsByUTP = (utpIssues: any[]) => {
  const map: any = {};

  utpIssues.forEach((issue) => {
    const id = issue.UTP?.Id;
    if (!id) return;

    if (!map[id]) {
      map[id] = { protest: 0, admitted: 0 };
    }

    const amount = Number(issue.Amount || 0);
    const type = (issue.PaymentType || "").toLowerCase();

    if (type.includes("protest")) {
      map[id].protest += amount;
    } else if (type.includes("admitted")) {
      map[id].admitted += amount;
    }
  });

  return map;
};

/** FINAL GRAPH DATA */
export const buildUTPSummaryGraph = (utpData: any[], utpIssues: any[]) => {
  const utps = getLatestApprovedUTPs(utpData);
  const issueMap = getIssueAmountsByUTP(utpIssues);

  let gross = 0;
  let protest = 0;
  let admitted = 0;
  let cashflow = 0;

  utps.forEach((utp: any) => {
    const g = Number(utp.GrossExposure || 0);
    const p = Number(issueMap[utp.Id]?.protest || 0);
    const a = Number(issueMap[utp.Id]?.admitted || 0);

    gross += g;
    protest += p;
    admitted += a;
    cashflow += g - p;
  });

  return [
    { label: "Gross Exposure", value: gross },
    { label: "Payment Under Protest", value: protest },
    { label: "Admitted Tax", value: admitted },
    { label: "Cash Flow Exposure", value: cashflow },
  ];
};
