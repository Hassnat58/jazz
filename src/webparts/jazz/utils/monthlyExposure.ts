/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @rushstack/no-new-null */
/* Monthly Gross Exposure Chart Builder */

export const buildMonthlyExposureChart = (
  utpData: any[],
  selectedMonth?: Date | null,
) => {
  /* -------- 1. get latest approved UTP -------- */

  const latestMap: any = {};

  utpData.forEach((item) => {
    if (item.ApprovalStatus?.toLowerCase() !== "approved") return;
    if (!item.UTPId) return;

    if (!latestMap[item.UTPId] || item.Id > latestMap[item.UTPId].Id) {
      latestMap[item.UTPId] = item;
    }
  });

  const approvedUTP = Object.values(latestMap);

  /* -------- 2. group by month -------- */

  const monthly: Record<string, { IncomeTax: number; SalesTax: number }> = {};

  approvedUTP.forEach((u: any) => {
    if (!u.UTPDate) return;

    const d = new Date(u.UTPDate);

    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

    if (!monthly[key]) monthly[key] = { IncomeTax: 0, SalesTax: 0 };

    if (u.TaxType === "Income Tax" || u.TaxType === "Income tax")
      monthly[key].IncomeTax += Number(u.GrossExposure || 0);
    else monthly[key].SalesTax += Number(u.GrossExposure || 0);
  });

  /* -------- 3. sort months -------- */

  const months = Object.keys(monthly)
    .map((m) => ({
      key: m,
      date: new Date(Number(m.split("-")[0]), Number(m.split("-")[1]) - 1),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  /* -------- 4. rolling 4 month filter -------- */

  /* -------- 4. filtering logic -------- */

  let filtered: any[] = [];

  if (selectedMonth) {
    // selected month → show 4 months window
    const endDate = new Date(selectedMonth);
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 3);

    filtered = months.filter((m) => m.date >= startDate && m.date <= endDate);
  } else {
    // NO filter → show all months till current month
    const today = new Date();

    filtered = months.filter((m) => m.date <= today);
  }

  /* -------- 5. format chart data -------- */

  /* -------- 5. format chart data (CUMULATIVE) -------- */

  let runningIncome = 0;
  let runningSales = 0;

  return filtered.map((m) => {
    const monthIncome = Math.round(monthly[m.key].IncomeTax);
    const monthSales = Math.round(monthly[m.key].SalesTax);

    // carry forward logic
    runningIncome += monthIncome;
    runningSales += monthSales;

    return {
      name: m.date.toLocaleString("default", { month: "short" }),
      incomeTax: runningIncome,
      salesTax: runningSales,
    };
  });
};
