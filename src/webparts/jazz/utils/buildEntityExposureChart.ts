/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const buildEntityExposureChart = (utpData: any[]) => {
  // STEP 1 — latest approved per UTPId
  const latestApprovedMap: Record<string, any> = {};

  utpData.forEach((u) => {
    if (u.ApprovalStatus?.toLowerCase() !== "approved") return;
    if (!u.UTPId) return;

    if (!latestApprovedMap[u.UTPId] || u.Id > latestApprovedMap[u.UTPId].Id) {
      latestApprovedMap[u.UTPId] = u;
    }
  });

  const approvedUTPs = Object.values(latestApprovedMap);

  // STEP 2 — group by entity
  const entityMap: Record<string, number> = {};

  approvedUTPs.forEach((u: any) => {
    const entity = u?.CaseNumber?.Entity || "Unknown";
    const exposure = Number(u.GrossExposure) || 0;

    if (!entityMap[entity]) entityMap[entity] = 0;

    entityMap[entity] += exposure;
  });

  // STEP 3 — recharts format
  return Object.keys(entityMap).map((entity) => ({
    name: entity,
    exposure: entityMap[entity],
  }));
};
