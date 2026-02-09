/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const buildForumWiseCasesChart = (utpData: any[], issues: any[]) => {
  // STEP 1 — get latest approved UTP per UTPId
  const latestApprovedMap: Record<string, any> = {};

  utpData.forEach((u) => {
    if (u.ApprovalStatus?.toLowerCase() !== "approved") return;
    if (!u.UTPId) return;

    if (!latestApprovedMap[u.UTPId] || u.Id > latestApprovedMap[u.UTPId].Id) {
      latestApprovedMap[u.UTPId] = u;
    }
  });

  const approvedUTPs = Object.values(latestApprovedMap);

  // STEP 2 — build forum map
  const forumMap: Record<string, any> = {};

  approvedUTPs.forEach((utp: any) => {
    const forum = utp?.CaseNumber?.PendingAuthority || "Unknown";

    if (!forumMap[forum]) {
      forumMap[forum] = {
        name: forum,
        "Income Tax Cases": 0,
        "Sales Tax Cases": 0,
      };
    }

    // STEP 3 — find related issues
    const relatedIssues = issues.filter(
      (i) => i.UTP?.Id === utp.Id || i.UTPId === utp.Id,
    );

    // STEP 4 — count cases
    relatedIssues.forEach((issue: any) => {
      const taxType = issue.UTP?.TaxType || "Income Tax";

      if (taxType === "Income Tax") forumMap[forum]["Income Tax Cases"] += 1;

      if (taxType === "Sales Tax") forumMap[forum]["Sales Tax Cases"] += 1;
    });
  });

  // STEP 5 — recharts array
  return Object.values(forumMap);
};
