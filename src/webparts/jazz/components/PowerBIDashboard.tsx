/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */

import * as React from "react";
import ManagersTable from "./ManagersTable";
import { spfi, SPFx } from "@pnp/sp";
import RiskTaxExposureTable from "./RiskTaxExposureTable";
import { buildRiskTaxExposureTable } from "../utils/utpExposureTable";
import ForumSummaryTable from "./ForumSummaryTable";
import { buildForumSummaryTable } from "../utils/utpForumSummaryTable";
import UTPSummaryGraph from "./UTPSummaryGraph";
import { buildUTPSummaryGraph } from "../utils/utpSummaryGraph";
import TaxTypeCasesChart from "./TaxTypeCasesChart";
import { buildTaxTypeCasesChart } from "../utils/taxtypecases";
import { buildRiskWiseExposureChart } from "../utils/buildRiskWiseExposureChart";
import RiskWiseExposureChart from "./RiskWiseExposureChart";
import { buildForumWiseExposureChart } from "../utils/buildForumWiseExposureChart";
import ForumWiseExposureChart from "./ForumWiseExposureChart";
import ForumWiseCasesChart from "./ForumWiseCasesChart";
import { buildForumWiseCasesChart } from "../utils/buildForumWiseCasesChart";
import EntityExposureChart from "./EntityExposureChart";
import { buildEntityExposureChart } from "../utils/buildEntityExposureChart";
import { buildMonthlyExposureChart } from "../utils/monthlyExposure";
import MonthlyExposureChart from "./MonthlyExposureChart";

const PowerBIDashboard: React.FC<{ SpfxContext: any; attachments: any }> = ({
  SpfxContext,
  attachments,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [hasRole, setHasRole] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isManager, setIsManager] = React.useState(false);
  const [utpData, setUtpData] = React.useState<any[]>([]);
  const [utpIssues, setUtpIssues] = React.useState<any[]>([]);
  const today = new Date();

  const [toDate, setToDate] = React.useState<Date>(
    new Date(today.getFullYear(), today.getMonth() + 1, 0),
  );
  const [minUtpDate, setMinUtpDate] = React.useState<Date | null>(null);
  const [isMonthFiltered, setIsMonthFiltered] = React.useState(false);

  React.useEffect(() => {
    const loadDashboard = async () => {
      try {
        const sp = spfi().using(SPFx(SpfxContext));

        const currentUser = await sp.web.currentUser();

        const roles = await sp.web.lists
          .getByTitle("Role")
          .items.filter(`Person/Id eq ${currentUser.Id}`)
          .select("Role", "Person/Id")
          .expand("Person")();

        const anyRole = roles.length > 0;
        setHasRole(anyRole);
        setIsAdmin(roles.some((r: any) => r.Role === "Admin"));
        setIsManager(roles.some((r: any) => r.Role === "Manager"));

        const utp = await sp.web.lists
          .getByTitle("UTPData")
          .items.select(
            "*",
            "TaxType",
            "GrossExposure",
            "ApprovalStatus",
            "UTPId",
            "ApprovalStatus",
            "CaseNumber/PendingAuthority",
            "CaseNumber/Entity",
            "UTPDate",
          )
          // .filter(`ApprovalStatus eq 'Approved'`)
          .top(5000)
          .expand("CaseNumber")();

        const dates = utp
          .map((u: any) => u.UTPDate)
          .filter(Boolean)
          .map((d: string) => new Date(d));

        if (dates.length) {
          const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
          const startMonth = new Date(
            minDate.getFullYear(),
            minDate.getMonth(),
            1,
          );

          setMinUtpDate(startMonth);
          // setFromDate(startMonth);
        }

        const issues = await sp.web.lists
          .getByTitle("UTP Tax Issue")
          .items.select(
            "*",
            "UTP/Id",
            "UTP/UTPId",
            "UTP/TaxType",
            "RiskCategory",
            "PaymentType",
            "Amount",
            "GrossTaxExposure",
          )
          .expand("UTP")
          .top(5000)();

        setUtpData(utp);
        setUtpIssues(issues);
        // console.log("utp data", utp);
        console.log("utp issues", issues);

        if (!anyRole) return;
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [SpfxContext]);
  const filteredUtpData = React.useMemo(() => {
    if (!minUtpDate || !toDate) return utpData;

    return utpData.filter((item: any) => {
      if (!item.UTPDate) return false;

      const d = new Date(item.UTPDate);
      return d >= minUtpDate && d <= toDate;
    });
  }, [utpData, minUtpDate, toDate]);

  /* ===== Rolling Month Dataset (ONLY for Monthly Chart) ===== */

  const rollingMonthUtpData = React.useMemo(() => {
    if (!utpData.length) return [];
    // CASE 1 — No month filter → show ALL data till current month
    if (!isMonthFiltered) {
      const today = new Date();
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      return utpData.filter((item: any) => {
        if (!item.UTPDate) return false;
        return new Date(item.UTPDate) <= end;
      });
    }

    // CASE 2 — Month selected → rolling 4 months
    const end = toDate;
    const start = new Date(end.getFullYear(), end.getMonth() - 3, 1);

    return utpData.filter((item: any) => {
      if (!item.UTPDate) return false;
      const d = new Date(item.UTPDate);
      return d >= start && d <= end;
    });
  }, [utpData, toDate, isMonthFiltered]);

  const exposureTableData = React.useMemo(() => {
    return buildRiskTaxExposureTable(utpData, utpIssues, toDate);
  }, [utpData, utpIssues, toDate]);

  const forumTableData = React.useMemo(() => {
    return buildForumSummaryTable(filteredUtpData);
  }, [filteredUtpData]);

  const utpSummaryGraphData = React.useMemo(() => {
    return buildUTPSummaryGraph(filteredUtpData, utpIssues);
  }, [filteredUtpData, utpIssues]);
  const taxTypeCasesChartData = React.useMemo(() => {
    return buildTaxTypeCasesChart(filteredUtpData, utpIssues);
  }, [filteredUtpData, utpIssues]);

  const riskWiseExposureChartData = React.useMemo(() => {
    return buildRiskWiseExposureChart(filteredUtpData, utpIssues);
  }, [filteredUtpData, utpIssues]);

  const forumWiseExposureData = React.useMemo(() => {
    return buildForumWiseExposureChart(filteredUtpData, utpIssues);
  }, [filteredUtpData, utpIssues]);
  const forumWiseCasesData = React.useMemo(() => {
    return buildForumWiseCasesChart(filteredUtpData, utpIssues);
  }, [filteredUtpData, utpIssues]);
  const entityExposureChartData = React.useMemo(() => {
    return buildEntityExposureChart(filteredUtpData);
  }, [filteredUtpData, utpIssues]);
  const monthlyExposureChartData = React.useMemo(() => {
    return buildMonthlyExposureChart(rollingMonthUtpData);
  }, [rollingMonthUtpData]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>
    );
  }

  if (!hasRole) {
    return (
      <div style={{ textAlign: "center", fontSize: "18px", fontWeight: 600 }}>
        You do not have access.
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "black", color: "#fff" }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <div style={{ margin: 10, padding: 10 }}>
          <label style={{ color: "#fff", marginRight: 10 }}>
            Select Month:
          </label>

          <input
            type="month"
            value={`${toDate.getFullYear()}-${String(
              toDate.getMonth() + 1,
            ).padStart(2, "0")}`}
            min={
              minUtpDate
                ? `${minUtpDate.getFullYear()}-${String(
                    minUtpDate.getMonth() + 1,
                  ).padStart(2, "0")}`
                : undefined
            }
            onChange={(e) => {
              if (!e.target.value) {
                const today = new Date();

                setIsMonthFiltered(false);
                setToDate(
                  new Date(today.getFullYear(), today.getMonth() + 1, 0),
                );
                return;
              }

              const [y, m] = e.target.value.split("-");

              setIsMonthFiltered(true);
              setToDate(new Date(Number(y), Number(m), 0));
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 25,
          marginBottom: "30px",
        }}
      >
        <RiskTaxExposureTable data={exposureTableData} />
        <ForumSummaryTable data={forumTableData} />
        <UTPSummaryGraph data={utpSummaryGraphData} />
        <TaxTypeCasesChart data={taxTypeCasesChartData} />
        <RiskWiseExposureChart data={riskWiseExposureChartData} />
        <ForumWiseExposureChart data={forumWiseExposureData} />
        <ForumWiseCasesChart data={forumWiseCasesData} />
        <EntityExposureChart data={entityExposureChartData} />
        <MonthlyExposureChart data={monthlyExposureChartData} />
      </div>

      {/* ================= MANAGERS TABLE ================= */}
      {(isAdmin || isManager) && <ManagersTable SpfxContext={SpfxContext} />}
    </div>
  );
};

export default PowerBIDashboard;
