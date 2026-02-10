/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

/* Optional: Risk priority if needed later
const RISK_PRIORITY: any = {
  Probable: 3,
  Possible: 2,
  Remote: 1,
};
*/

// 1️⃣ Get latest APPROVED UTP per UTPId AS OF SELECTED MONTH
const getLatestApprovedUTPs = (utpData: any[], toDate: Date) => {
  const map: any = {};

  // End of selected month in UTC
  const target = new Date(
    Date.UTC(toDate.getFullYear(), toDate.getMonth() + 1, 0, 23, 59, 59, 999),
  );

  utpData.forEach((item) => {
    if (item.ApprovalStatus !== "Approved") return;
    if (!item.UTPId || !item.UTPDate) return;

    // Interpret SharePoint date strictly as UTC
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

    // Only revisions existing at reporting date
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

// 2️⃣ Normalize tax type (case-insensitive) for table keys
const normalizeTaxType = (type?: string): string => {
  if (!type) return "Unknown";
  const t = type.trim().toLowerCase();
  if (t === "income tax") return "Income Tax";
  if (t === "sales tax") return "Sales Tax";
  return type; // keep others as-is
};

// 3️⃣ Build final risk tax exposure table
export const buildRiskTaxExposureTable = (
  utpData: any[],
  utpIssues: any[],
  toDate: Date,
) => {
  const approvedUTPs = getLatestApprovedUTPs(utpData, toDate);

  // Map approved UTP revisions by Id
  const approvedByRevisionId = new Map(approvedUTPs.map((u: any) => [u.Id, u]));

  // Initialize table with default tax types
  const table: Record<string, Record<string, number>> = {
    "Income Tax": { Probable: 0, Possible: 0, Remote: 0, Total: 0 },
    "Sales Tax": { Probable: 0, Possible: 0, Remote: 0, Total: 0 },
    Total: { Probable: 0, Possible: 0, Remote: 0, Total: 0 },
  };

  utpIssues.forEach((issue) => {
    const utp = approvedByRevisionId.get(issue.UTP?.Id);
    if (!utp) return;

    const taxType = normalizeTaxType(issue.UTP?.TaxType);
    const risk = issue.RiskCategory || "Remote";
    const exposure = Number(issue.GrossTaxExposure || 0);

    // Dynamically add tax type if not in table
    if (!table[taxType]) {
      table[taxType] = { Probable: 0, Possible: 0, Remote: 0, Total: 0 };
    }

    table[taxType][risk] += exposure;
    table[taxType].Total += exposure;

    table.Total[risk] += exposure;
    table.Total.Total += exposure;
  });

  return table;
};
