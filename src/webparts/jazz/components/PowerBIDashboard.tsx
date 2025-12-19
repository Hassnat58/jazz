/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */

import * as React from "react";
import ManagersTable from "./ManagersTable";
import { spfi, SPFx } from "@pnp/sp";
import styles from "../components/Dashboard.module.scss";
import CaseStatusChart from "./CaseStatusChart";
import ExposureTrendChart from "./ExpossureLineChart";
import FinancialYearChart from "./FinancialYearChart";
import TaxExposureChart from "./TaxExposureChart";
import MonthlyRiskRateChart from "./MonthlyRiskChartRate";
import RiskExposureTable from "./RiskExposureTable";
import AuthorityExposureTable from "./AuthorityExposureTable";

const PowerBIDashboard: React.FC<{ SpfxContext: any; attachments: any }> = ({
  SpfxContext,
  attachments,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [hasRole, setHasRole] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isManager, setIsManager] = React.useState(false);

  const [totalCases, setTotalCases] = React.useState(0);
  const [totalExposure, setTotalExposure] = React.useState(0);
  const [totalActiveExposure, setTotalActiveExposure] = React.useState(0);
  const [financialYearExposureData, setFinancialYearExposureData] =
    React.useState<any[]>([]);
  const [caseStatusData, setCaseStatusData] = React.useState<any[]>([]);
  const [exposureTrendData, setExposureTrendData] = React.useState<any[]>([]);
  const [taxExposureData, setTaxExposureData] = React.useState<any[]>([]);
  const [monthlyriskchart, setMonthlyRiskChart] = React.useState<any[]>([]);
  const [riskExposureTable, setRiskExposureTable] = React.useState<any[]>([]);
  const [authorityExposureTable, setAuthorityExposureTable] = React.useState<
    any[]
  >([]);

  React.useEffect(() => {
    const loadDashboard = async () => {
      try {
        const sp = spfi().using(SPFx(SpfxContext));

        /* =========================
           USER ROLE LOGIC (UNCHANGED)
        ========================== */
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

        if (!anyRole) return;

        /* =========================
           CASES LIST
        ========================== */
        const cases: any[] = await sp.web.lists
          .getByTitle("Cases")
          .items.select(
            "ID",
            "Title",
            "GrossExposure",
            "ApprovalStatus",
            "TaxType",
            "Created",
            "DateReceived",
            "PendingAuthority"
          )
          .top(5000)();

        // Total Exposure (sum of all)
        const exposureSum = cases.reduce(
          (sum, c) => sum + (c.GrossExposure || 0),
          0
        );
        setTotalExposure(exposureSum);

        // Total Cases (greatest ID per Title)
        const caseMap = new Map<string, any>();
        cases.forEach((item) => {
          const existing = caseMap.get(item.Title);
          if (!existing || item.ID > existing.ID) {
            caseMap.set(item.Title, item);
          }
        });
        setTotalCases(caseMap.size);
        const monthlyMap = new Map<string, number>();

        cases.forEach((c) => {
          const date = new Date(c.DateReceived);
          const month = date.toLocaleString("default", {
            month: "short",
            year: "numeric",
          });

          monthlyMap.set(
            month,
            (monthlyMap.get(month) || 0) + (c.GrossExposure || 0)
          );
        });

        setFinancialYearExposureData(
          Array.from(monthlyMap.entries()).map(([Month, GrossExposure]) => ({
            Month,
            GrossExposure,
          }))
        );

        const statusMap = new Map<string, number>();

        cases.forEach((c) => {
          const status = c.ApprovalStatus || "Unknown";
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });

        setCaseStatusData(
          Array.from(statusMap.entries()).map(([status, count]) => ({
            status,
            count,
          }))
        );

        const monthlyTaxMap = new Map<
          string,
          { IncomeTax: number; SalesTax: number }
        >();

        cases.forEach((c) => {
          if (!c.DateReceived) return;

          const month = new Date(c.DateReceived).toLocaleString("default", {
            month: "long",
          });

          if (!monthlyTaxMap.has(month)) {
            monthlyTaxMap.set(month, { IncomeTax: 0, SalesTax: 0 });
          }

          const record = monthlyTaxMap.get(month)!;

          if (c.TaxType === "Income Tax") {
            record.IncomeTax += c.GrossExposure || 0;
          } else if (c.TaxType === "Sales Tax") {
            record.SalesTax += c.GrossExposure || 0;
          }
        });

        const taxExposureChartData = Array.from(monthlyTaxMap.entries()).map(
          ([Month, values]) => ({
            Month,
            IncomeTax: values.IncomeTax,
            SalesTax: values.SalesTax,
            total: values.IncomeTax + values.SalesTax,
          })
        );

        setTaxExposureData(taxExposureChartData);

        // Group cases by Title
        const casesByTitle = new Map<string, any[]>();

        cases.forEach((c) => {
          if (!casesByTitle.has(c.Title)) {
            casesByTitle.set(c.Title, []);
          }
          casesByTitle.get(c.Title)!.push(c);
        });

        // Final list used for table calculations
        const effectiveCases: any[] = [];

        casesByTitle.forEach((items) => {
          // Only Approved items
          const approvedItems = items
            .filter((i) => i.ApprovalStatus === "Approved")
            .sort((a, b) => b.ID - a.ID); // latest first

          // Include ONLY if at least one approved exists
          if (approvedItems.length > 0) {
            effectiveCases.push(approvedItems[0]); // latest approved
          }
        });

        const authorityMap = new Map<
          string,
          { incomeTax: number; salesTax: number }
        >();

        effectiveCases.forEach((c) => {
          const authority = c.PendingAuthority || "Unknown";
          const exposure = c.GrossExposure || 0;

          if (!authorityMap.has(authority)) {
            authorityMap.set(authority, { incomeTax: 0, salesTax: 0 });
          }

          const record = authorityMap.get(authority)!;

          if (c.TaxType === "Income Tax") {
            record.incomeTax += exposure;
          } else if (c.TaxType === "Sales Tax") {
            record.salesTax += exposure;
          }
        });

        const authorityTableData = Array.from(authorityMap.entries()).map(
          ([authority, values]) => ({
            authority,
            incomeTax: values.incomeTax,
            salesTax: values.salesTax,
            total: values.incomeTax + values.salesTax,
          })
        );

        setAuthorityExposureTable(authorityTableData);

        /* =========================
           UTPDATA LIST
        ========================== */
        const utpItems: any[] = await sp.web.lists
          .getByTitle("UTPData")
          .items.select(
            "ID",
            "UTPId",
            "GrossExposure",
            "CaseNumber/Id",
            "CaseNumber/Title",
            "CaseNumber/FinancialYear"
          )
          .expand("CaseNumber")
          .filter(` ApprovalStatus eq 'Approved'`)
          .top(5000)();

        // Group by UTPId → greatest ID
        const utpMap = new Map<number, any>();
        utpItems.forEach((item) => {
          const existing = utpMap.get(item.UTPId);
          if (!existing || item.ID > existing.ID) {
            utpMap.set(item.UTPId, item);
          }
        });

        // Total Active Exposure
        const activeExposureSum = Array.from(utpMap.values()).reduce(
          (sum, item) => sum + (item.GrossExposure || 0),
          0
        );

        setTotalActiveExposure(activeExposureSum);

        const utpTaxIssues: any[] = await sp.web.lists
          .getByTitle("UTP Tax Issue")
          .items.select(
            "ID",
            "RiskCategory",
            "Rate",
            "GrossTaxExposure",
            "UTP/Id",
            "UTP/UTPDate",
            "UTP/TaxType"
          )
          .expand("UTP")
          .top(5000)();

        const monthMap = new Map<
          string,
          { Possible: number; Probable: number; Remote: number }
        >();

        utpTaxIssues.forEach((item) => {
          if (!item.UTP?.UTPDate) return;

          const month = new Date(item.UTP.UTPDate).toLocaleString("default", {
            month: "short",
          });

          if (!monthMap.has(month)) {
            monthMap.set(month, { Possible: 0, Probable: 0, Remote: 0 });
          }

          const record = monthMap.get(month)!;
          const exposure = item.GrossTaxExposure || 0;

          switch (item.RiskCategory) {
            case "Possible":
              record.Possible += exposure;
              break;
            case "Probable":
              record.Probable += exposure;
              break;
            case "Remote":
              record.Remote += exposure;
              break;
          }
        });
        const utpRiskChartData = Array.from(monthMap.entries()).map(
          ([Month, values]) => ({
            Month,
            Possible: values.Possible,
            Probable: values.Probable,
            Remote: values.Remote,
          })
        );

        setExposureTrendData(utpRiskChartData);

        const monthlyriskMap = new Map<
          string,
          {
            Possible: number;
            Probable: number;
            Remote: number;
            total: number;
          }
        >();
        utpTaxIssues.forEach((item) => {
          if (!item.UTP?.UTPDate) return;

          const month = new Date(item.UTP.UTPDate).toLocaleString("default", {
            month: "short",
          });

          if (!monthlyriskMap.has(month)) {
            monthlyriskMap.set(month, {
              Possible: 0,
              Probable: 0,
              Remote: 0,
              total: 0,
            });
          }

          const record = monthlyriskMap.get(month)!;
          const exposure = item.GrossTaxExposure || 0;

          switch (item.RiskCategory) {
            case "Possible":
              record.Possible += exposure;
              break;
            case "Probable":
              record.Probable += exposure;
              break;
            case "Remote":
              record.Remote += exposure;
              break;
          }

          record.total += exposure;
        });

        const utpRiskRateChartData = Array.from(monthlyriskMap.entries()).map(
          ([Month, values]) => ({
            Month,
            Possible: values.Possible,
            Probable: values.Probable,
            Remote: values.Remote,
            total: values.total, // 🔥 used in tooltip
          })
        );
        setMonthlyRiskChart(utpRiskRateChartData);

        const riskMap = new Map<
          string,
          { incomeTax: number; salesTax: number }
        >();

        utpTaxIssues.forEach((item) => {
          const risk = item.RiskCategory;
          const exposure = item.GrossTaxExposure || 0;
          const taxType = item.UTP?.TaxType; // 🔥 IMPORTANT

          if (!risk) return;

          if (!riskMap.has(risk)) {
            riskMap.set(risk, { incomeTax: 0, salesTax: 0 });
          }

          const record = riskMap.get(risk)!;

          if (taxType === "Income Tax") {
            record.incomeTax += exposure;
          } else if (taxType === "Sales Tax") {
            record.salesTax += exposure;
          }
        });

        // Convert map → array
        const tableData = Array.from(riskMap.entries()).map(
          ([risk, values]) => ({
            risk,
            incomeTax: values.incomeTax,
            salesTax: values.salesTax,
            total: values.incomeTax + values.salesTax,
          })
        );

        setRiskExposureTable(tableData);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [SpfxContext]);

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
    <>
      {/* ================= KPI CARDS ================= */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div className={styles["kpi-card"]}>
          <h4>Total Active Exposure</h4>
          <p>{totalActiveExposure.toLocaleString()}</p>
        </div>

        <div className={styles["kpi-card"]}>
          <h4>Total Exposure</h4>
          <p>{totalExposure.toLocaleString()}</p>
        </div>
        <div className={styles["kpi-card"]}>
          <h4>Total Cases</h4>
          <p>{totalCases}</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 24,
          marginBottom: "30px",
        }}
      >
        <FinancialYearChart data={financialYearExposureData} />
        <CaseStatusChart data={caseStatusData} />
        <ExposureTrendChart data={exposureTrendData} />
        <TaxExposureChart data={taxExposureData} />
        <MonthlyRiskRateChart data={monthlyriskchart} />
        <RiskExposureTable data={riskExposureTable} />
        <AuthorityExposureTable data={authorityExposureTable} />
      </div>

      {/* ================= MANAGERS TABLE ================= */}
      {(isAdmin || isManager) && <ManagersTable SpfxContext={SpfxContext} />}
    </>
  );
};

export default PowerBIDashboard;
