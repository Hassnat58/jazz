/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable no-fallthrough */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-case-declarations */
import * as React from "react";
import { useState, useEffect } from "react";
import styles from "./Reports.module.scss";
import CorrespondenceDetailOffCanvas from "./ReportsOffCanvas";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/attachments";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// import { Button } from "react-bootstrap";
interface CaseItem {
  [key: string]: any; // flexible structure, since fields differ per report
}

type ReportType =
  | "UTP"
  | "Litigation"
  | "ActiveCases"
  | "Provisions1"
  | "Provisions2"
  | "Provisions3"
  | "Contingencies"
  | "ERM";

const reportConfig: Record<
  ReportType,
  { columns: { header: string; field: keyof CaseItem }[] }
> = {
  UTP: {
    columns: [
      { header: "UTP ID", field: "utpId" },
      { header: "MLR Claim ID", field: "mlrClaimId" },
      { header: "Tax Matter", field: "taxType" },
      { header: "Tax Authority", field: "taxAuthority" },
      { header: "Pending Authority", field: "pendingAuthority" },
      { header: "Entity", field: "entity" },
      { header: "Type", field: "type" },
      { header: "Financial Year", field: "fy" },
      { header: "Tax Year", field: "taxYear" },
      // { header: "Gross Exposure PKR Jul 2024", field: "grossExposureJul" },
      { header: "Gross Exposure ", field: "grossExposureJun" },
      // { header: "Variance with last month PKR", field: "varianceLastMonth" },
      // { header: "Gross Exposure PKR May 2024", field: "grossExposureMay" },
      // { header: "Gross Exposure PKR Apr 2024", field: "grossExposureApr" },
      { header: "Category", field: "category" },
      { header: "ARC Top Tax Risks Reporting", field: "arcTopTaxRisk" },
      { header: "Contingency Note", field: "contingencyNote" },
      { header: "Description", field: "briefDescription" },
      { header: "Provision GL Code", field: "provisionGlCode" },
      { header: "Provision GRS Code", field: "provisionGrsCode" },
      { header: "Payment under Protest", field: "paymentUnderProtest" },
      { header: "Payment GL Code", field: "paymentGlCode" },
      { header: "UTP Paper Category", field: "utpPaperCategory" },
      { header: "Provisions/Contingencies", field: "provisionsContingencies" },
    ],
  },

  Litigation: {
    columns: [
      { header: "Type", field: "type" },
      { header: "Case Number", field: "caseNo" },
      { header: "Issue", field: "issue" },
      { header: "Authority", field: "taxAuthority" },
      { header: "Entity", field: "entity" },
      { header: "Tax Year", field: "taxYear" },
      { header: "Tax exposure SCN", field: "taxExposureScn" },
      { header: "Tax exposure Order", field: "taxExposureOrder" },
      { header: "Tax period Start", field: "taxPeriodStart" },
      { header: "Tax period End", field: "taxPeriodEnd" },
      { header: "Date of Receipt", field: "dateOfReceipt" },
      { header: "Stay obtained From", field: "stayObtainedFrom" },
      { header: "Pending Authority Level", field: "pendingAuthorityLevel" },
      { header: "Stay Expiring On", field: "stayExpiringOn" },
      { header: "Compliance Date", field: "complianceDate" },
      { header: "Status", field: "status" },
      { header: "SCN/Order Summary", field: "scnOrderSummary" },
      { header: "Consultant", field: "consultant" },
      { header: "Email Title", field: "emailTitle" },
      { header: "HC Document Number", field: "hcDocumentNumber" },
      { header: "Billing Information", field: "billingInfo" },
      { header: "Review Status LP", field: "reviewStatusLp" },
      { header: "In UTP", field: "inUtp" },
    ],
  },

  ActiveCases: {
    columns: [
      { header: "No.", field: "caseNo" },
      { header: "Entity", field: "entity" },
      { header: "Tax Authority", field: "taxAuthority" },
      { header: "Tax Year/Tax Period", field: "taxYear" },
      { header: "Type of order", field: "type" },
      { header: "Nature of order", field: "briefDescription" },
      { header: "Tax demand (PKR)", field: "amount" },
      { header: "Date of receipt of notice/order", field: "dateReceived" },
      { header: "Compliance Date", field: "complianceDate" },
      { header: "Cut-off date to seek stay", field: "stayExpiringOn" },
      // { header: "Forum to file appeal", field: "nextForum" },
      // { header: "Forum to file stay application", field: "pendingAuthority" },
      { header: "Description", field: "briefDescription" },
      // { header: "Wayforward", field: "contingencyNote" },
    ],
  },

  Provisions1: {
    columns: [
      { header: "GL Code", field: "glCode" },
      { header: "Tax Matter", field: "taxType" },
      { header: "Provision Type", field: "provisionType" },
      { header: "Entity", field: "entity" },
      { header: "Current Month Amount", field: "currentMonthAmount" },
      { header: "Previous Month Amount", field: "previousMonthAmount" },
      { header: "Variance", field: "variance" },
    ],
  },

  Provisions2: {
    columns: [
      { header: "GRS Code", field: "GRSCode" },
      { header: "Tax Matter", field: "taxType" },
      { header: "Entity", field: "entity" },
      { header: "Current Month Amount", field: "GrossExposure" },
    ],
  },
  Provisions3: {
    columns: [
      { header: "", field: "label" }, // metric name (row label)
      { header: "Current Month (PKR)", field: "current" },
      { header: "Prior Month (PKR)", field: "prior" },
      { header: "Variance (PKR)", field: "variance" },
    ],
  },

  Contingencies: {
    columns: [
      { header: "GL Code", field: "glCode" },
      { header: "Tax Matter", field: "taxType" },
      { header: "Entity", field: "entity" },
      { header: "Current Month Amount", field: "currentMonthAmount" },
      { header: "Previous Month Amount", field: "previousMonthAmount" },
      { header: "Variance", field: "variance" },
    ],
  },

  ERM: {
    columns: [
      { header: "Entity", field: "entity" },
      { header: "Risk Type", field: "category" },
      { header: "Exposure Amount (FCY)", field: "currentMonthAmount" },
      { header: "Exchange Rate", field: "variance" },
      { header: "Exposure Amount (PKR)", field: "previousMonthAmount" },
    ],
  },
};

const ReportsTable: React.FC<{ SpfxContext: any; reportType: ReportType }> = ({
  SpfxContext,
  reportType,
}) => {
  const [show, setShow] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lovOptions, setLovOptions] = useState<{
    [key: string]: IDropdownOption[];
  }>({});

  const [filters, setFilters] = useState({
    dateStart: "",
    dateEnd: "",
    category: "",
    financialYear: "",
    taxYear: "",
    taxType: "",
    taxAuthority: "",
    entity: "",
  });
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    filters.dateStart ? new Date(filters.dateStart) : null,
    filters.dateEnd ? new Date(filters.dateEnd) : null,
  ]);
  const [startDate, endDate] = dateRange;

  const exportReport = (type: ReportType, data: CaseItem[]) => {
    const config = reportConfig[type];
    let exportData: Record<string, any>[] = [];

    // default: just map raw data
    exportData = data.map((r) => mapRow(r, config));

    // Helper to map fields
    function mapRow(item: CaseItem, cfg: typeof config) {
      const row: Record<string, any> = {};
      cfg.columns.forEach((col) => {
        row[col.header] = item[col.field] ?? "";
      });
      return row;
    }

    // Create worksheet + workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    // Add number formatting
    Object.keys(worksheet).forEach((cell) => {
      if (cell[0] === "!") return; // skip meta
      if (typeof worksheet[cell].v === "number") {
        worksheet[cell].t = "n";
        worksheet[cell].z = "#,##0.00"; // adds commas + 2 decimals
      }
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${type}_Report`);

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_Report.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filterCurrentMonth = (data: CaseItem[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return data.filter((item) => {
      if (!item.UTPDate) return false;
      const utpDate = new Date(item.UTPDate);
      return (
        utpDate.getMonth() === currentMonth &&
        utpDate.getFullYear() === currentYear
      );
    });
  };

  const normalizeData = (reportType: string, rawData: any[]) => {
    switch (reportType) {
      case "Litigation":
        return rawData.map((item) => ({
          type: item.TaxType || "", // "Type" → In/Out
          caseNo: item.Title || item.Id || "", // "Case Number"
          issue: item.IssuedBy || "", // "Issue"
          taxAuthority: item.TaxAuthority || "", // "Authority"
          entity: item.Entity || "", // "Entity"
          taxYear: item.TaxYear || "", // "Tax Year"

          // exposures (only TaxExposure exists for now)
          taxExposureScn: item.TaxExposureScn || "", // "Tax exposure SCN" (placeholder)
          taxExposureOrder: item.TaxExposureOrder || "", // "Tax exposure Order" (placeholder)
          taxExposure: item.TaxExposure || "", // "Tax Exposure"

          // tax period dates (placeholders)
          taxPeriodStart: item.TaxPeriodStartDate
            ? new Date(item.TaxPeriodStartDate).toLocaleDateString()
            : "",
          taxPeriodEnd: item.TaxPeriodEndDate
            ? new Date(item.TaxPeriodEndDate).toLocaleDateString()
            : "",

          // dates
          dateOfReceipt: item.DateReceived
            ? new Date(item.DateReceived).toLocaleDateString()
            : "", // "Date of Receipt"
          complianceDate: item.DateofCompliance
            ? new Date(item.DateofCompliance).toLocaleDateString()
            : "", // "Compliance Date"
          stayExpiringOn: item.StayExpiringOn
            ? new Date(item.StayExpiringOn).toLocaleDateString()
            : "", // "Stay Expiring On"

          // other fields
          stayObtainedFrom: item.StayObtainedFrom || "", // "Stay obtained From"
          pendingAuthorityLevel: item.NextForum_x002f_PendingAuthority || "",
          status: item.CaseStatus || "", // "Status"
          scnOrderSummary: item.SCN_x002f_Ordersummaryonissuesad || "", // "SCN/Order Summary"
          consultant: item.TaxConsultantAssigned || "", // "Consultant"
          emailTitle: item.Email || "", // "Email Title"
          hcDocumentNumber: item.DocumentReferenceNumber || "", // "HC Document Number"

          // placeholders for not in object
          billigInfo: item.BilligInfo || item.Jurisdiction || "", // "Billing Information"
          reviewSntatusLp: item.eviewSntatusLp || "", // "Review Status LP"

          inUtp: item.IsDraft ? "Draft" : "Final",
          // "In UTP"
        }));

      case "ActiveCases":
        return rawData.map((item) => ({
          type: item.CorrespondenceType || "", // "Type" → In/Out
          caseNo: item.Title || item.Id || "", // "Case Number"
          issue: item.BriefDescription || item.CaseBriefDescription || "", // "Issue"
          taxAuthority: item.TaxAuthority || "", // "Authority"
          entity: item.Entity || "", // "Entity"
          taxYear: item.FinancialYear || "", // "Tax Year"
          taxExposureScn: item.GrossTaxDemanded || "", // "Tax exposure SCN"
          taxExposureOrder: item.TaxexposureStage || "", // "Tax exposure Order"
          taxPeriodStart: item.TaxPeriodStartDate
            ? new Date(item.TaxPeriodStartDate).toLocaleDateString()
            : "",
          taxPeriodEnd: item.Hearingdate
            ? new Date(item.Hearingdate).toLocaleDateString()
            : "",
          dateOfReceipt: item.DateReceived
            ? new Date(item.DateReceived).toLocaleDateString()
            : "",
          stayObtainedFrom: item.IssuedBy || "", // "Stay obtained From"
          pendingAuthorityLevel: item.NextForum_x002f_PendingAuthority || "", // "Pending Authority Level"
          stayExpiringOn: item.Modified || "", // "Stay Expiring On"
          complianceDate: item.DateofCompliance
            ? new Date(item.DateofCompliance).toLocaleDateString()
            : "",
          status: item.CaseStatus || "", // "Status"
          scnOrderSummary: item.Comments || "", // "SCN/Order Summary"
          consultant: item.TaxConsultantAssigned || "", // "Consultant"
          emailTitle: item.Email || "", // "Email Title"
          hcDocumentNumber: item.DocumentReferenceNumber || "", // "HC Document Number"
          billingInfo: item.Jurisdiction || "", // "Billing Information" → (mapped from Jurisdiction since no billing field exists)
          reviewStatusLp: item.ConcerningLaw || "",
          briefDescription: item.BriefDescription || "",
          // "In UTP"
        }));
      case "Provisions1":
        // Group by provision type & GL code
        const groupBy = (arr: CaseItem[], keyFn: (r: CaseItem) => string) => {
          return arr.reduce((acc, r) => {
            const key = keyFn(r);
            if (!acc[key]) acc[key] = [];
            acc[key].push(r);
            return acc;
          }, {} as Record<string, CaseItem[]>);
        };
        const now = new Date();
        const currentMonth = now.getMonth(); // 0 = Jan, 7 = Aug
        const year = now.getFullYear();

        const prevDate = new Date(year, currentMonth - 1, 1);
        const prevMonth = prevDate.getMonth();
        const enriched = rawData.map((r) => {
          const d = r.UTPDate ? new Date(r.UTPDate) : null;
          return {
            ...r,
            month: d ? d.getMonth() : null,
            year: d ? d.getFullYear() : null,
          };
        });
        const segregated = groupBy(enriched, (r) => r.TaxType);
        console.log(segregated);

        const exportData: any[] = [];

        Object.entries(segregated).forEach(([TaxType, rows]) => {
          const byGL = groupBy(rows, (r) => r.GMLRID);

          let subtotalCurr = 0;
          let subtotalPrev = 0;

          Object.entries(byGL).forEach(([GMLRID, records]) => {
            const curr = records
              .filter((r: any) => r.month === currentMonth && r.year === year)
              .reduce((sum: any, r: any) => sum + r.GrossExposure, 0);

            const prev = records
              .filter((r: any) => r.month === prevMonth && r.year === year)
              .reduce((sum: any, r: any) => sum + r.GrossExposure, 0);

            const variance = curr - prev;

            subtotalCurr += curr;
            subtotalPrev += prev;

            exportData.push({
              glCode: GMLRID,
              taxType: records[0]?.TaxType || "",
              provisionType:
                TaxType == "Income Tax" ? "Above Ebitda" : "Below Ebitda",
              entity: records[0]?.Entity || "",
              currentMonthAmount: curr,
              previousMonthAmount: prev,
              variance: variance,
            });
          });

          // Subtotal row
          exportData.push({
            glCode: "",
            taxType: "",
            provisionType: "",
            entity: "Sub Total",
            currentMonthAmount: subtotalCurr,
            previousMonthAmount: subtotalPrev,
            Variance: subtotalCurr - subtotalPrev,
          });
        });

        // Grand total
        const totalCurr = exportData
          .filter((r) => r.Entity === "Sub Total")
          .reduce((sum, r) => sum + (r["Current Month Amount"] || 0), 0);

        const totalPrev = exportData
          .filter((r) => r.Entity === "Sub Total")
          .reduce((sum, r) => sum + (r["Previous Month Amount"] || 0), 0);

        exportData.push({
          "GL Code": "",
          "Tax Matter": "",
          "Provision Type": "",
          Entity: "Grand Total",
          "Current Month Amount": totalCurr,
          "Previous Month Amount": totalPrev,
          Variance: totalCurr - totalPrev,
        });
        console.log(exportData);
        return exportData;

      case "Provisions3":
        const now3 = new Date();
        const currentMonth3 = now3.getMonth();
        const currentYear3 = now3.getFullYear();
        const prevDate3 = new Date(currentYear3, currentMonth3 - 1, 1);
        const prevMonth3 = prevDate3.getMonth();
        const prevYear3 = prevDate3.getFullYear();

        // Enrich
        const enriched3 = rawData.map((r) => {
          const d = r.UTPDate ? new Date(r.UTPDate) : null;
          return {
            ...r,
            month: d ? d.getMonth() : null,
            year: d ? d.getFullYear() : null,
          };
        });

        // --- Core calculations ---
        const totalExposureCurr = enriched3
          .filter((r) => r.month === currentMonth3 && r.year === currentYear3)
          .reduce((s, r) => s + (r.GrossExposure || 0), 0);

        const totalExposurePrev = enriched3
          .filter((r) => r.month === prevMonth3 && r.year === prevYear3)
          .reduce((s, r) => s + (r.GrossExposure || 0), 0);

        const paymentsCurr = enriched3
          .filter((r) => r.month === currentMonth3 && r.year === currentYear3)
          .reduce((s, r) => s + (parseFloat(r.Paymentunderprotest) || 0), 0);

        const paymentsPrev = enriched3
          .filter((r) => r.month === prevMonth3 && r.year === prevYear3)
          .reduce((s, r) => s + (parseFloat(r.Paymentunderprotest) || 0), 0);

        const provisionCurr = enriched3
          .filter(
            (r) =>
              r.month === currentMonth3 &&
              r.year === currentYear3 &&
              r.RiskCategory === "Probable"
          )
          .reduce((s, r) => s + (r.GrossExposure || 0), 0);

        const provisionPrev = enriched3
          .filter(
            (r) =>
              r.month === prevMonth3 &&
              r.year === prevYear3 &&
              r.RiskCategory === "Probable"
          )
          .reduce((s, r) => s + (r.GrossExposure || 0), 0);
        const ebitdaCurr = enriched3
          .filter((r) => r.month === currentMonth3 && r.year === currentYear3)
          .reduce((s, r) => s + (r.EBITDAExposure || 0), 0);

        const ebitdaPrev = enriched3
          .filter((r) => r.month === prevMonth3 && r.year === prevYear3)
          .reduce((s, r) => s + (r.EBITDAExposure || 0), 0);
        // --- Build matrix rows ---
        const results3 = [
          {
            label: "Total Exposure",
            current: totalExposureCurr,
            prior: totalExposurePrev,
            variance: totalExposureCurr - totalExposurePrev,
          },
          {
            label: "Less – Payments under Protest",
            current: paymentsCurr,
            prior: paymentsPrev,
            variance: paymentsCurr - paymentsPrev,
          },
          {
            label: "Cashflow Exposure",
            current: totalExposureCurr - paymentsCurr,
            prior: totalExposurePrev - paymentsPrev,
            variance:
              totalExposureCurr -
              paymentsCurr -
              (totalExposurePrev - paymentsPrev),
          },
          {
            label: "Total Exposure",
            current: totalExposureCurr,
            prior: totalExposurePrev,
            variance: totalExposureCurr - totalExposurePrev,
          },
          {
            label: "Less – Total Provision",
            current: totalExposureCurr - provisionCurr,
            prior: totalExposurePrev - provisionPrev,
            variance: provisionCurr - provisionPrev,
          },
          {
            label: "P&L Exposure",
            current: totalExposureCurr - provisionCurr,
            prior: totalExposurePrev - provisionPrev,
            variance:
              totalExposureCurr -
              provisionCurr -
              (totalExposurePrev - provisionPrev),
          },
          {
            label: "EBITDA Exposure (%)",
            current: ebitdaCurr,
            prior: ebitdaPrev,
            variance: ebitdaCurr - ebitdaPrev,
          },
        ];

        return results3;

      case "Provisions2":
        const currentMonthData: any = filterCurrentMonth(rawData);

        // Group & sum by GRS Code
        const summarized = Object.values(
          currentMonthData.reduce((acc: any, item: any) => {
            if (!acc[item.GRSCode]) {
              acc[item.GRSCode] = {
                GRSCode: item.GRSCode || "",
                entity: item.Entity || "",
                taxType: item.TaxMatter || "",
                GrossExposure: 0,
              };
            }
            acc[item.GRSCode].GrossExposure += item.GrossExposure || 0;
            return acc;
          }, {})
        );

        // Subtotal
        const total = summarized.reduce(
          (sum: number, r: any) => sum + (r.GrossExposure || 0),
          0
        );

        // Add subtotal row
        summarized.push({
          GRSCode: "",
          entity: "Sub Total",
          taxType: "",
          GrossExposure: total,
        });

        return summarized;

      case "Contingencies":
        // helper: group by GLCode
        const groupBy2 = (arr: CaseItem[], keyFn: (r: CaseItem) => string) => {
          return arr.reduce((acc, r) => {
            const key = keyFn(r);
            if (!acc[key]) acc[key] = [];
            acc[key].push(r);
            return acc;
          }, {} as Record<string, CaseItem[]>);
        };

        const now1 = new Date();
        const currentMonth1 = now1.getMonth(); // 0 = Jan
        const year1 = now1.getFullYear();

        const prevDate1 = new Date(year1, currentMonth1 - 1, 1);
        const prevMonth1 = prevDate1.getMonth();

        const enriched1 = rawData.map((r) => {
          const d = r.UTPDate ? new Date(r.UTPDate) : null;
          return {
            ...r,
            month: d ? d.getMonth() : null,
            year: d ? d.getFullYear() : null,
          };
        });

        const grouped = groupBy2(enriched1, (r) => r.GMLRID);

        const exportData3: any[] = [];
        let subtotalCurr = 0;
        let subtotalPrev = 0;

        Object.entries(grouped).forEach(([GMLRID, records]) => {
          const curr = records
            .filter((r: any) => r.month === currentMonth1 && r.year === year1)
            .reduce((sum: any, r: any) => sum + (r.GrossExposure || 0), 0);

          const prev = records
            .filter((r: any) => r.month === prevMonth1 && r.year === year1)
            .reduce((sum: any, r: any) => sum + (r.GrossExposure || 0), 0);

          subtotalCurr += curr;
          subtotalPrev += prev;

          // Push only ONE row per GLCode
          exportData3.push({
            glCode: GMLRID,
            taxType: records[0]?.TaxMatter || "Brief Description",
            entity: records[0]?.Entity || "",
            currentMonthAmount: curr || 0,
            previousMonthAmount: prev || 0,
            variance: (curr || 0) - (prev || 0),
          });
        });

        // Subtotal row
        exportData3.push({
          glCode: "",
          taxType: "",
          entity: "Sub Total",
          currentMonthAmount: subtotalCurr,
          previousMonthAmount: subtotalPrev,
          variance: subtotalCurr - subtotalPrev,
        });

        return exportData3;

      case "ERM":
        return rawData.map((item) => ({
          entity: item.UTPCategory || "",
          category: item.RiskCategory || "", // Risk Type
          currentMonthAmount: item.GrossExposure || 0, // Exposure Amount (FCY)
          variance: 280 as any, // Example static Exchange Rate (replace with real field if exists)
          previousMonthAmount: item.CashFlowExposure || 0, // Exposure Amount (PKR)
        }));
      default: // UTPData
        return rawData.map((item) => ({
          utpId: item.UTPId, // exists (currently null in your data)
          mlrClaimId: item.GMLRID, // mapping from GMLRID
          taxType: item.TaxMatter, // exists
          taxAuthority: item.TaxAuthority, // ❌ not in data (will be undefined)
          pendingAuthority: item.PendingAuthority, // exists but null
          entity: item.Entity, // exists but null
          type: item.PaymentType, // exists but null
          fy: item.FinancialYear, // exists but null
          taxYear: item.TaxYear, // exists but null
          grossExposureJul: item.GrossExposure, // only one field, reusing
          grossExposureJun: item.GrossExposure,
          varianceLastMonth: item.VarianceWithLastMonthPKR, // ❌ not in data (undefined)
          grossExposureMay: item.GrossExposure,
          grossExposureApr: item.GrossExposure,
          category: item.UTPCategory, // exists
          arcTopTaxRisk: item.ARCtopTaxRisksReporting, // ❌ not in data (undefined)
          contingencyNote: item.ContigencyNote, // exists but null (be careful: property is "ContigencyNote" with missing 'n')
          briefDescription: item.Description, // exists but null
          provisionGlCode: item.ProvisionGLCode, // ❌ not in data (undefined)
          provisionGrsCode: item.GRSCode, // exists
          paymentUnderProtest: item.Paymentunderprotest, // exists but null (note lowercase "u")
          paymentGlCode: item.PaymentGLCode, // ❌ not in data (undefined)
          utpPaperCategory: item.UTPPaperCategory, // exists but null
          provisionsContingencies: item.ProvisionsContingencies, // ❌ not in data (undefined)
        }));
    }
  };

  const getListName = (type: ReportType) => {
    if (type === "Litigation" || type === "ActiveCases") {
      return "Cases";
    }
    return "UTPData";
  };

  const [data, setData] = useState<CaseItem[]>([]);
  const [filteredData, setFilteredData] = useState<CaseItem[]>([]);
  const sp = spfi().using(SPFx(SpfxContext));

  const handleShow = (item: CaseItem) => {
    setSelectedCase(item);
    setShow(true);
  };
  console.log(handleShow);

  const fetchData = async () => {
    setLoading(true);
    try {
      const listName = getListName(reportType);
      const items = await sp.web.lists.getByTitle(listName).items();
      const items_updated = normalizeData(reportType, items);
      setData(items_updated);
      setFilteredData(items_updated); // start unfiltered
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false); // stop loading
    }
  };
  useEffect(() => {
    fetchData();
  }, [reportType]);

  useEffect(() => {
    const fetchLOVs = async () => {
      const items = await sp.web.lists
        .getByTitle("LOV Data")
        .items.select("Id", "Title", "Description", "Status")();
      const activeItems = items.filter((item) => item.Status === "Active");
      const grouped: { [key: string]: IDropdownOption[] } = {};
      activeItems.forEach((item) => {
        if (!grouped[item.Title]) grouped[item.Title] = [];
        grouped[item.Title].push({
          key: item.Description,
          text: item.Description,
        });
      });
      setLovOptions(grouped);
    };

    fetchLOVs();
  }, []);
  const handleFilterChange = (key: string, value: string) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);

    const filtered = data.filter((item) => {
      console.log(data, updatedFilters);
      let dateMatch = true;

      if (updatedFilters.dateStart || updatedFilters.dateEnd) {
        const start = updatedFilters.dateStart
          ? new Date(updatedFilters.dateStart)
          : null;
        const end = updatedFilters.dateEnd
          ? new Date(updatedFilters.dateEnd)
          : null;

        let itemDate: Date | null = null;

        if (reportType === "Litigation" || reportType === "ActiveCases") {
          itemDate = item.dateOfReceipt ? new Date(item.dateOfReceipt) : null;
        } else {
          itemDate = item.UTPDate ? new Date(item.UTPDate) : null;
        }

        if (itemDate) {
          if (start && end) {
            dateMatch = itemDate >= start && itemDate <= end;
          } else if (start) {
            dateMatch = itemDate >= start;
          } else if (end) {
            dateMatch = itemDate <= end;
          }
        } else {
          dateMatch = false;
        }
      }

      // ---- OTHER FILTERS ----
      switch (reportType) {
        case "UTP":
        case "Provisions1":
        case "Provisions2":
        case "Provisions3":
        case "Contingencies":
        case "ERM":
          return (
            dateMatch &&
            (!updatedFilters.category ||
              item.category === updatedFilters.category) &&
            (!updatedFilters.financialYear ||
              item.fy === updatedFilters.financialYear) &&
            (!updatedFilters.taxYear ||
              item.taxYear === updatedFilters.taxYear) &&
            (!updatedFilters.taxType ||
              item.taxType === updatedFilters.taxType) &&
            (!updatedFilters.taxAuthority ||
              item.taxAuthority === updatedFilters.taxAuthority) &&
            (!updatedFilters.entity || item.entity === updatedFilters.entity)
          );

        case "Litigation":
        case "ActiveCases":
          return (
            dateMatch &&
            (!updatedFilters.taxYear ||
              item.taxYear === updatedFilters.taxYear) &&
            (!updatedFilters.taxAuthority ||
              item.taxAuthority === updatedFilters.taxAuthority) &&
            (!updatedFilters.entity || item.entity === updatedFilters.entity)
          );

        // return (
        //   dateMatch &&
        //   (!updatedFilters.entity || item.entity === updatedFilters.entity) &&
        //   (!updatedFilters.taxType || item.taxType === updatedFilters.taxType)
        // );

        default:
          return dateMatch;
      }
    });

    setFilteredData(filtered);
  };

  return (
    <>
      <div className={styles.filtersRow}>
        {/* Date Range */}
        {/* <input
          type="date"
          value={filters.dateStart}
          onChange={(e) => handleFilterChange("dateStart", e.target.value)}
          className={styles.filterInput}
        /> */}
        {/* <input
    type="date"
    value={filters.dateEnd}
    onChange={(e) => handleFilterChange("dateEnd", e.target.value)}
    className={styles.filterInput}
  /> */}
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Date Range</label>
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => {
              setDateRange(update);

              const newStart = update[0]
                ? update[0].toISOString().split("T")[0]
                : "";
              const newEnd = update[1]
                ? update[1].toISOString().split("T")[0]
                : "";

              // Update state
              setFilters((prev) => ({
                ...prev,
                dateStart: newStart,
                dateEnd: newEnd,
              }));

              // Only apply filters that actually exist
              if (update[0]) handleFilterChange("dateStart", newStart);
              if (update[1]) handleFilterChange("dateEnd", newEnd);

              // If both are cleared
              if (!update[0] && !update[1]) {
                handleFilterChange("dateStart", "");
                handleFilterChange("dateEnd", "");
              }
            }}
            isClearable
            placeholderText="Select date range"
            calendarClassName={styles.customCalendar}
            dayClassName={(date: any) =>
              startDate && endDate && date >= startDate && date <= endDate
                ? `${styles.customDay} ${styles.inRange}`
                : styles.customDay
            }
          />
        </div>
        <Dropdown
          label="Entity"
          placeholder="Select Entity"
          options={lovOptions.Entity || []}
          selectedKey={filters.entity || null}
          onChange={(_, option) =>
            handleFilterChange("entity", option?.key as string)
          }
          styles={{ root: { minWidth: 160 } }}
        />

        <Dropdown
          label="Tax Type"
          placeholder="Select Tax Type"
          options={lovOptions["Tax Type"] || []}
          selectedKey={filters.taxType || null}
          onChange={(_, option) =>
            handleFilterChange("taxType", option?.key as string)
          }
          styles={{ root: { minWidth: 160 } }}
        />
        <Dropdown
          label="Tax Authority"
          placeholder="Select Tax Authority"
          options={lovOptions.TaxAuthority || []}
          selectedKey={filters.taxAuthority || null}
          onChange={(_, option) =>
            handleFilterChange("taxAuthority", option?.key as string)
          }
          styles={{ root: { minWidth: 160 } }}
        />

        <Dropdown
          label="Tax Year"
          placeholder="Select Tax Year"
          options={lovOptions["Tax Year"] || []}
          selectedKey={filters.taxYear || null}
          onChange={(_, option) =>
            handleFilterChange("taxYear", option?.key as string)
          }
          styles={{ root: { minWidth: 160 } }}
        />

        <Dropdown
          label="Financial Year"
          placeholder="Select Financial Year"
          options={lovOptions["Financial Year"] || []}
          selectedKey={filters.financialYear || null}
          onChange={(_, option) =>
            handleFilterChange("financialYear", option?.key as string)
          }
          styles={{ root: { minWidth: 160 } }}
        />
        <Dropdown
          label="Category"
          placeholder="Select Category"
          options={lovOptions.Category || []}
          selectedKey={filters.category || null}
          onChange={(_, option) =>
            handleFilterChange("category", option?.key as string)
          }
          styles={{ root: { minWidth: 160 } }}
        />
        {/* <Dropdown
  label="Report Type"
  options={[
    { key: "UTP", text: "UTP Report" },
    { key: "Litigation", text: "Litigation Report" },
    { key: "ActiveCases", text: "Active Cases Weekly" },
    { key: "Provisions1", text: "Provisions Report - 1" },
    { key: "Provisions2", text: "Provisions Report - 2" },
    { key: "Contingencies", text: "Contingencies Breakup" },
    { key: "ERM", text: "ERM Foreign Currency" }
  ]}
  selectedKey={reportType}
  onChange={(_, option) => setReportType(option?.key as ReportType)}
/> */}

        <div className={styles.buttonGroup}>
          <button
            className={styles.clearButton}
            onClick={() => {
              const reset = {
                dateStart: "",
                dateEnd: "",
                category: "",
                financialYear: "",
                taxYear: "",
                taxType: "",
                taxAuthority: "",
                entity: "",
              };
              setFilters(reset);
              setFilteredData(data); // restore original unfiltered dataset
            }}
          >
            Clear Filters
          </button>

          <button
            className={styles.exportButton}
            onClick={() => exportReport(reportType, filteredData)}
          >
            Export {reportType} Report
          </button>
          <button
            className={styles.refreshButton}
            onClick={() => {
              setFilters({
                dateStart: "",
                dateEnd: "",
                category: "",
                financialYear: "",
                taxYear: "",
                taxType: "",
                taxAuthority: "",
                entity: "",
              });
              // setFilteredData(dummyData);
            }}
          >
            ⟳
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {reportConfig[reportType].columns.map((col) => (
                <th key={col.header}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={reportConfig[reportType].columns.length}
                  style={{ textAlign: "center" }}
                >
                  Loading...
                </td>
              </tr>
            ) : (
              filteredData.map((item, idx) => (
                <tr key={idx}>
                  {reportConfig[reportType].columns.map((col) => (
                    <td key={col.header}>{item[col.field] ?? ""}</td>
                  ))}
                  {/* <td>

                  <Button
                    variant="outline-warning"
                    size="sm" onClick={() => handleShow(item)}
                  >
                    👁                </Button>
                </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {selectedCase && (
          <CorrespondenceDetailOffCanvas
            show={show}
            handleClose={() => setShow(false)}
            caseData={selectedCase}
          />
        )}
      </div>
    </>
  );
};

export default ReportsTable;
