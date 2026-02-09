/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

const RISK_PRIORITY: any = {
  Probable: 3,
  Possible: 2,
  Remote: 1,
};

// 1️⃣ Get latest APPROVED UTP per UTPId
// 1️⃣ Get latest APPROVED UTP per UTPId AS OF SELECTED MONTH
const getLatestApprovedUTPs = (utpData: any[], toDate: Date) => {
  const map: any = {};

  const target = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0);

  utpData.forEach((item) => {
    if (item.ApprovalStatus !== "Approved") return;
    if (!item.UTPId || !item.UTPDate) return;

    const d = new Date(item.UTPDate);
    if (d > target) return; // ⭐ critical line

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

// 2️⃣ Get highest risk per UTPData.Id
const getHighestRiskByUTP = (utpIssues: any[]) => {
  const riskMap: any = {};

  utpIssues.forEach((issue) => {
    const utpDataId = issue.UTP?.Id;
    const risk = issue.RiskCategory;

    if (!utpDataId || !risk) return;

    if (
      !riskMap[utpDataId] ||
      RISK_PRIORITY[risk] > RISK_PRIORITY[riskMap[utpDataId]]
    ) {
      riskMap[utpDataId] = risk;
    }
  });

  return riskMap;
};

// 3️⃣ FINAL TABLE DATA
export const buildRiskTaxExposureTable = (
  utpData: any[],
  utpIssues: any[],
  toDate: Date,
) => {
  const approvedUTPs = getLatestApprovedUTPs(utpData, toDate);

  const riskMap = getHighestRiskByUTP(utpIssues);

  const table: any = {
    "Income Tax": { Probable: 0, Possible: 0, Remote: 0, Total: 0 },
    "Sales Tax": { Probable: 0, Possible: 0, Remote: 0, Total: 0 },
    Total: { Probable: 0, Possible: 0, Remote: 0, Total: 0 },
  };

  approvedUTPs.forEach((utp: any) => {
    const taxType = utp.TaxType;
    const exposure = Number(utp.GrossExposure || 0);
    const risk = riskMap[utp.Id];

    if (!risk || !table[taxType]) return;

    table[taxType][risk] += exposure;
    table[taxType].Total += exposure;

    table.Total[risk] += exposure;
    table.Total.Total += exposure;
  });

  return table;
};
