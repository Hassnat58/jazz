/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const buildForumWiseExposureChart = (utpData: any[], issues: any[]) => {
  // STEP 1 — latest approved UTP per UTPId
  const latestApprovedMap: Record<string, any> = {};

  utpData.forEach((u) => {
    if (u.ApprovalStatus?.toLowerCase() !== "approved") return;
    if (!u.UTPId) return;

    if (!latestApprovedMap[u.UTPId] || u.Id > latestApprovedMap[u.UTPId].Id) {
      latestApprovedMap[u.UTPId] = u;
    }
  });

  const approvedUTPs = Object.values(latestApprovedMap);

  // STEP 2 — dynamic forum detection
  const forumMap: Record<string, any> = {};

  approvedUTPs.forEach((utp: any) => {
    const forum = utp?.CaseNumber?.PendingAuthority || "Unknown";

    if (!forumMap[forum]) {
      forumMap[forum] = {
        name: forum,
        "Income Tax Exposure": 0,
        "Sales Tax Exposure": 0,
      };
    }

    // STEP 3 — attach issues
    const relatedIssues = issues.filter(
      (i) => i.UTP?.Id === utp.Id || i.UTP?.UTPId === utp.Id,
    );

    relatedIssues.forEach((issue: any) => {
      const amount = Number(issue.GrossTaxExposure || 0);
      const taxType = issue.UTP?.TaxType || "Income Tax";

      if (taxType === "Income Tax" || taxType === "Income tax")
        forumMap[forum]["Income Tax Exposure"] += amount;

      if (taxType === "Sales Tax")
        forumMap[forum]["Sales Tax Exposure"] += amount;
    });
  });

  // STEP 4 — convert to recharts array
  return Object.values(forumMap);
};
