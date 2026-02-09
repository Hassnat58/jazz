/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const buildTaxTypeCasesChart = (utpData: any[], issues: any[]) => {
  /** Latest approved version per UTPId */
  const map: any = {};

  utpData.forEach((item) => {
    if (item.ApprovalStatus?.toLowerCase() !== "approved") return;
    if (!item.UTPId) return;

    if (!map[item.UTPId] || item.Id > map[item.UTPId].Id) {
      map[item.UTPId] = item;
    }
  });

  const approvedUTPs = Object.values(map);
  const validIds = approvedUTPs.map((u: any) => u.Id);

  // only issues belonging to approved UTP
  const filtered = issues.filter((i) => validIds.includes(i.UTP?.Id));

  const risks = ["Probable", "Possible", "Remote"];

  const result: any = {
    Probable: { name: "Probable", "Income Tax": 0, "Sales Tax": 0 },
    Possible: { name: "Possible", "Income Tax": 0, "Sales Tax": 0 },
    Remote: { name: "Remote", "Income Tax": 0, "Sales Tax": 0 },
  };

  filtered.forEach((i) => {
    const risk = i.RiskCategory || "Remote";
    const tax = i.UTP?.TaxType || "Income Tax";

    if (!result[risk]) return;
    if (!result[risk][tax]) result[risk][tax] = 0;

    result[risk][tax] += 1;
  });

  return risks.map((r) => result[r]);
};
