/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const buildRiskWiseExposureChart = (utpData: any[], issues: any[]) => {
  /** latest approved UTP per UTPId */
  const latestApprovedMap: any = {};

  utpData.forEach((u) => {
    if (u.ApprovalStatus?.toLowerCase() !== "approved") return;
    if (!u.UTPId) return;

    if (!latestApprovedMap[u.UTPId] || u.Id > latestApprovedMap[u.UTPId].Id) {
      latestApprovedMap[u.UTPId] = u;
    }
  });

  const approvedUTPs = Object.values(latestApprovedMap);
  const approvedIds = approvedUTPs.map((u: any) => u.Id);

  const filteredIssues = issues.filter((i) => approvedIds.includes(i.UTP?.Id));

  const result: any = {
    Probable: {
      name: "Probable",
      "Income Tax Exposure": 0,
      "Sales Tax Exposure": 0,
    },
    Possible: {
      name: "Possible",
      "Income Tax Exposure": 0,
      "Sales Tax Exposure": 0,
    },
    Remote: {
      name: "Remote",
      "Income Tax Exposure": 0,
      "Sales Tax Exposure": 0,
    },
  };

  filteredIssues.forEach((i) => {
    const risk = i.RiskCategory || "Remote";
    const taxType = i.UTP?.TaxType || "Income Tax";
    const amount = Number(i.GrossTaxExposure || 0); // PKR Millions

    if (!result[risk]) return;

    if (taxType === "Income Tax") {
      result[risk]["Income Tax Exposure"] += amount;
    }

    if (taxType === "Sales Tax") {
      result[risk]["Sales Tax Exposure"] += amount;
    }
  });

  return ["Probable", "Possible", "Remote"].map((r) => result[r]);
};
