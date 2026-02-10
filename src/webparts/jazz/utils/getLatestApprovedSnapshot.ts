/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* Latest Approved UTP snapshot as of selected month */

export const getLatestApprovedSnapshot = (utpData: any[], toDate: Date) => {
  if (!utpData?.length) return [];

  const snapshot: any = {};

  const target = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0);

  utpData.forEach((item) => {
    if (item.ApprovalStatus !== "Approved") return;
    if (!item.UTPId || !item.UTPDate) return;

    const d = new Date(item.UTPDate);
    if (d > target) return;

    const key = item.UTPId;

    const isLater = (a: any, b: any) => {
      if (!a) return true;

      const ad = new Date(a.UTPDate);
      const bd = new Date(b.UTPDate);

      if (bd > ad) return true;
      if (bd.getTime() === ad.getTime()) return b.Id > a.Id;
      return false;
    };

    if (!snapshot[key] || isLater(snapshot[key], item)) {
      snapshot[key] = item;
    }
  });

  return Object.values(snapshot);
};
