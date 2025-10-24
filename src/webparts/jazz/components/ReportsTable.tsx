/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-use-before-define */
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
import { ComboBox } from "@fluentui/react";
import Pagination from "./Pagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// import { Button } from "react-bootstrap";
interface CaseItem {
  [key: string]: any; // flexible structure, since fields differ per report
}
const getYearOptionsFY = (): IDropdownOption[] => {
  const currentYear = new Date().getFullYear();
  const years: IDropdownOption[] = [];
  for (let y = currentYear; y >= 1980; y--) {
    years.push({ key: "FY" + y.toString(), text: "FY" + y.toString() });
  }
  return years;
};
const getYearOptions = (): IDropdownOption[] => {
  const currentYear = new Date().getFullYear();
  const years: IDropdownOption[] = [];
  for (let y = currentYear; y >= 1980; y--) {
    years.push({ key: y.toString(), text: y.toString() });
  }
  return years;
};
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
      { header: "Tax Matter", field: "taxMatter" },
      { header: "Tax Authority", field: "taxAuthority" },
      { header: "Pending Authority", field: "pendingAuthority" },
      { header: "Entity", field: "entity" },
      { header: "Tax Type", field: "taxType" },
      { header: "Financial Year", field: "fy" },
      { header: "Tax Year", field: "taxYear" },
      { header: "UTP Issue", field: "utpIssue" },
      { header: "Amount contested", field: "amtContested" },
      { header: "Rate", field: "rate" },

      // { header: "Gross Exposure PKR Jul 2024", field: "grossExposureJul" },
      { header: "Gross Exposure ", field: "grossExposureJun" },
      // { header: "Variance with last month PKR", field: "varianceLastMonth" },
      // { header: "Gross Exposure PKR May 2024", field: "grossExposureMay" },
      // { header: "Gross Exposure PKR Apr 2024", field: "grossExposureApr" },
      { header: "Risk Category", field: "category" },
      { header: "Contingency Note", field: "contingencyNote" },
      { header: "Brief Description", field: "briefDescription" },
      { header: "Provision GL Code", field: "provisionGlCode" },
      { header: "Provision GRS Code", field: "provisionGrsCode" },
      { header: "Payment under Protest", field: "paymentUnderProtest" },
      { header: "Payment GL Code", field: "paymentGlCode" },
      { header: "Admitted Tax", field: "admittedTax" },
      { header: "UTP Paper Category", field: "utpPaperCategory" },
      { header: "ERM Category", field: "ermCategory" },
      { header: "Cash flow exposure PKR", field: "cashFlowExposurePKR" },
      { header: "P&L exposure PKR", field: "plExposurePKR" },
      { header: "EBITDA exposure PKR", field: "ebitdaExposurePKR" },
      { header: "ERM unique numbering", field: "ermUniqueNumbering" },
      { header: "Case Number", field: "caseNumber" },

    ],
  },

  Litigation: {
    columns: [
      { header: "Tax Type", field: "type" },
      { header: "Case Number", field: "caseNo" },
      { header: "Issue", field: "issue" },
      { header: "Authority", field: "taxAuthority" },
      { header: "Entity", field: "entity" },
      { header: "Tax Year", field: "taxYear" },
      // { header: "Tax exposure SCN", field: "taxExposureScn" },
      // { header: "Tax exposure Order", field: "taxExposureOrder" },
      // { header: "Tax period Start", field: "taxPeriodStart" },
      // { header: "Tax period End", field: "taxPeriodEnd" },
      { header: "Date of Receipt", field: "dateOfReceipt" },
      { header: "Gross Exposure", field: "grossExp" },

      // { header: "Stay obtained From", field: "stayObtainedFrom" },
      { header: "Pending Authority Level", field: "pendingAuthorityLevel" },
      { header: "Stay Expiring On", field: "stayExpiringOn" },
      { header: "Compliance Date", field: "complianceDate" },
      { header: "Status", field: "status" },
      { header: "SCN/Order Summary", field: "scnOrderSummary" },
      { header: "Consultant", field: "consultant" },
      { header: "Email Title", field: "emailTitle" },
      { header: "HC Document Number", field: "hcDocumentNumber" },
      // { header: "Billing Information", field: "billingInfo" },
      // { header: "Review Status LP", field: "reviewStatusLp" },
      { header: "In UTP", field: "inUtp" },
    ],
  },

  ActiveCases: {
    columns: [
      { header: "Case No.", field: "caseNo" },
      { header: "Entity", field: "entity" },
      { header: "Tax Authority", field: "taxAuthority" },
      { header: "Tax Year/Tax Period", field: "taxYear" },
      { header: "Type of order", field: "type" },
      { header: "Nature of order", field: "briefDescription" },
      { header: "Tax demand (PKR)", field: "grossExp" },
      { header: "Date of receipt of notice/order", field: "dateReceived" },
      { header: "Compliance Date", field: "complianceDate" },
      // { header: "Cut-off date to seek stay", field: "stayExpiringOn" }
      // { header: "Forum to file appeal", field: "nextForum" },
      // { header: "Forum to file stay application", field: "pendingAuthority" },
      { header: "Description", field: "briefDescription" },
      { header: "Gross Exposure", field: "grossExp" },

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
      { header: "Tax Matter", field: "taxMatter" },
      { header: "Tax Type", field: "taxType" },
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const [filters, setFilters] = useState({
    dateStart: "",
    dateEnd: "",
    dateRangeStart: "",
    dateRangeEnd: "",
    category: "",
    financialYear: "",
    taxYear: "",
    taxType: "",
    taxAuthority: "",
    entity: "",
  });

  const exportRef = React.useRef<HTMLDivElement | null>(null);

  // keep a ref copy of the boolean to avoid stale closure issues
  const showExportOptionsRef = React.useRef(showExportOptions);
  useEffect(() => {
    showExportOptionsRef.current = showExportOptions;
  }, [showExportOptions]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    filters.dateRangeStart ? new Date(filters.dateRangeStart) : null,
    filters.dateRangeEnd ? new Date(filters.dateRangeEnd) : null,
  ]);
  const [startDate, endDate] = dateRange;
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // only do anything if menu is open
      if (!showExportOptionsRef.current) return;
      const target = e.target as Node;
      if (exportRef.current && !exportRef.current.contains(target)) {
        setShowExportOptions(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showExportOptionsRef.current) {
        setShowExportOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // empty deps -> attach once

  const exportReportPDF = (type: ReportType, data: CaseItem[]) => {
    const config = reportConfig[type];
    if (!config) return;

    // Prepare headers and rows
    const headers = config.columns.map((col) => col.header);
    const rows = data.map((item) =>
      config.columns.map((col) => item[col.field] ?? "")
    );

    const doc = new jsPDF({
      orientation: "landscape", // use portrait if you have fewer columns
      unit: "pt",
      format: "a4",
    });

    doc.setFontSize(14);
    doc.text(`${type} Report`, 40, 30);

    autoTable(doc, {
      startY: 50,
      head: [headers],
      body: rows,
      styles: {
        fontSize: 8,
        cellPadding: 4,
        halign: "left",
        valign: "middle",
      },
      headStyles: {
        fillColor: [22, 160, 133], // teal header
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
    });

    doc.save(`${type}_Report.pdf`);
  };
  const exportReport = (type: ReportType, data: CaseItem[]) => {
    const config = reportConfig[type];
    let exportData: Record<string, any>[] = [];

    // default: just map raw data
    exportData = filteredData.map((r) => mapRow(r, config));

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


  // format helpers
  const formatAmount = (
    value: number | string | null | undefined,
    style: "indian" | "western" = "western",
    decimals = 2
  ): string => {
    if (value === null || value === undefined || value === "") return "";

    const num = Number(value);
    if (isNaN(num)) return String(value);

    const sign = num < 0 ? "-" : "";
    const absNum = Math.abs(num);

    // ✅ Use Intl.NumberFormat for both styles
    const locale = style === "indian" ? "en-IN" : "en-US";

    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(absNum);

    return sign + formatted;
  };
  const getLatestUTPIssues = async (issues: any) => {
    if (!Array.isArray(issues) || issues.length === 0) return [];

    const latestMap = issues.reduce((acc: any, issue: any) => {
      const id = issue.UTPId;
      if (!id) return acc;

      const existing = acc[id];
      if (!existing || issue.Id > existing.Id) {
        acc[id] = issue; // ✅ Keep the one with the highest SharePoint item ID
      }

      return acc;
    }, {});

    return Object.values(latestMap);
  };
  const getLatestCaseIssues = async (issues: any) => {
    if (!Array.isArray(issues) || issues.length === 0) return [];

    const latestMap = issues.reduce((acc: any, issue: any) => {
      const id = issue.Title;
      if (!id) return acc;

      const existing = acc[id];
      if (!existing || issue.Id > existing.Id) {
        acc[id] = issue; // ✅ Keep the one with the highest SharePoint item ID
      }

      return acc;
    }, {});

    return Object.values(latestMap);
  };
  const normalizeData = async (
    reportType: string,
    rawData: any[],
    filter: any
  ) => {
    switch (reportType) {
      case "Litigation":
        const sp1 = spfi().using(SPFx(SpfxContext));
        const latestICases = await getLatestCaseIssues(rawData);
        const utpIssues1 = await sp1.web.lists
          .getByTitle("UTPData")
          .items.expand("CaseNumber") // lookup field
          .select("Id,UTPId,CaseNumber/Id")();

        // Map Litigation.Id → UTP row
        const utpMap = new Map(utpIssues1.map((u) => [u.CaseNumber?.Id, u]));

        const litigationData = latestICases.map((item: any) => {
          const utp = utpMap.get(item.ID); // match Litigation.Id

          return {
            type: item.TaxType || "",
            caseNo: item.Title || item.Id || "",
            issue: item.IssuedBy || "",
            taxAuthority: item.TaxAuthority || "",
            entity: item.Entity || "",
            taxYear: item.TaxYear || "",
            DateReceived: item.DateReceived || "",
            fy: item.FinancialYear || "",

            taxExposureScn: item.TaxExposure || "",
            taxExposureOrder: item.TaxExposureOrder || "",
            taxExposure: formatAmount(item.TaxExposure) || "",

            taxPeriodStart: item.TaxPeriodStartDate
              ? new Date(item.TaxPeriodStartDate).toISOString().split("T")[0]
              : "",
            taxPeriodEnd: item.TaxPeriodEndDate
              ? new Date(item.TaxPeriodEndDate).toISOString().split("T")[0]
              : "",

            dateOfReceipt: item.DateReceived
              ? new Date(item.DateReceived).toISOString().split("T")[0]
              : "",
            complianceDate: item.DateofCompliance
              ? new Date(item.DateofCompliance).toISOString().split("T")[0]
              : "",
            DateofCompliance: item.DateofCompliance
              ? new Date(item.DateofCompliance).toISOString().split("T")[0]
              : "",
            stayExpiringOn: item.StayExpiringOn
              ? new Date(item.StayExpiringOn).toISOString().split("T")[0]
              : "",

            stayObtainedFrom: item.StayObtainedFrom || "",
            pendingAuthorityLevel: item.PendingAuthority || "",
            status: item.CaseStatus || "",
            scnOrderSummary: item.OrderSummary || "",
            consultant: item.TaxConsultantAssigned || "",
            emailTitle: item.Email || "",
            hcDocumentNumber: item.DocumentReferenceNumber || "",

            billingInfo: item.BilligInfo || "",
            reviewStatusLp: "Peview Pending",
            grossExp: formatAmount(item.GrossExposure) || "",

            // ✅ now links UTPId if exists
            inUtp: utp?.UTPId || "",
          };
        });

        return litigationData;

      case "ActiveCases":
        const latestActive = await getLatestCaseIssues(rawData);
        return latestActive.map((item: any) => ({
          type: item.TaxType || "", // "Type" → In/Out
          caseNo: item.Title || item.Id || "", // "Case Number"
          issue: item.IssuedBy || "", // "Issue"
          taxAuthority: item.TaxAuthority || "", // "Authority"
          entity: item.Entity || "", // "Entity"
          taxYear: item.TaxYear || "", // "Tax Year"
          DateReceived: item.DateReceived || "",
          fy: item.FinancialYear || "",
          grossExp: formatAmount(item.GrossExposure) || "",
          // exposures (only TaxExposure exists for now)
          taxExposureScn: item.TaxExposureScn || "", // "Tax exposure SCN" (placeholder)
          taxExposureOrder: item.TaxExposureOrder || "", // "Tax exposure Order" (placeholder)
          amount: formatAmount(item.TaxExposure) || "", // "Tax Exposure"

          // tax period dates (placeholders)
          taxPeriodStart: item.TaxPeriodStartDate
            ? new Date(item.TaxPeriodStartDate).toISOString().split("T")[0]
            : "",
          taxPeriodEnd: item.TaxPeriodEndDate
            ? new Date(item.TaxPeriodEndDate).toISOString().split("T")[0]
            : "",

          // dates
          dateReceived: item.DateReceived
            ? new Date(item.DateReceived).toISOString().split("T")[0]
            : "", // "Date of Receipt"
          complianceDate: item.DateofCompliance
            ? new Date(item.DateofCompliance).toISOString().split("T")[0] // → "2025-09-25"
            : "", // "Compliance Date"
          DateofCompliance: item.DateofCompliance
            ? new Date(item.DateofCompliance).toISOString().split("T")[0] // → "2025-09-25"
            : "",
          stayExpiringOn: item.StayExpiringOn
            ? new Date(item.StayExpiringOn).toISOString().split("T")[0]
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
          briefDescription: item.BriefDescription || "",
          // "In UTP"
        }));
case "Provisions1": {
  const sp = spfi().using(SPFx(SpfxContext));

  // ---------- STEP 1: Determine effective period ----------
  const now = new Date();
  let effectiveCurrentMonth: number;
  let effectiveCurrentYear: number;
  let prevMonth: number;
  let prevYear: number;

  // --- Case 1: Month selector chosen ---
  if (filter.dateStart) {
    const selectedMonth = new Date(filter.dateStart); // e.g., "2025-07-01"
    effectiveCurrentMonth = selectedMonth.getMonth();
    effectiveCurrentYear = selectedMonth.getFullYear();
    const prev = new Date(effectiveCurrentYear, effectiveCurrentMonth - 1, 1);
    prevMonth = prev.getMonth();
    prevYear = prev.getFullYear();
  }

  // --- Case 2: Date range selected ---
  else if (filter.dateRangeStart && filter.dateRangeEnd) {
    const end = new Date(filter.dateRangeEnd);
    effectiveCurrentMonth = end.getMonth();
    effectiveCurrentYear = end.getFullYear();
    const prev = new Date(effectiveCurrentYear, effectiveCurrentMonth - 1, 1);
    prevMonth = prev.getMonth();
    prevYear = prev.getFullYear();
  }

  // --- Case 3: Nothing selected (system date fallback) ---
  else {
    effectiveCurrentMonth = now.getMonth();
    effectiveCurrentYear = now.getFullYear();
    const prev = new Date(effectiveCurrentYear, effectiveCurrentMonth - 1, 1);
    prevMonth = prev.getMonth();
    prevYear = prev.getFullYear();
  }

  // ---------- STEP 2: Pick latest UTP per month (same date => higher ID) ----------
  const latestByMonth = rawData.reduce((acc: any, utp: any) => {
    const d = new Date(utp.UTPDate);
    const month = d.getMonth();
    const year = d.getFullYear();
    const id = utp.UTPId;
    if (!id) return acc;
    if (!acc[id]) acc[id] = {};

    // Current month logic
    if (month === effectiveCurrentMonth && year === effectiveCurrentYear) {
      const curr = acc[id].current;
      if (
        !curr ||
        d > new Date(curr.UTPDate) ||
        (d.getTime() === new Date(curr.UTPDate).getTime() && utp.Id > curr.Id)
      ) {
        acc[id].current = utp;
      }
    }

    // Previous month logic
    else if (month === prevMonth && year === prevYear) {
      const prev = acc[id].previous;
      if (
        !prev ||
        d > new Date(prev.UTPDate) ||
        (d.getTime() === new Date(prev.UTPDate).getTime() && utp.Id > prev.Id)
      ) {
        acc[id].previous = utp;
      }
    }

    return acc;
  }, {});

  // ---------- STEP 3: Fetch UTP Tax Issues + GL Code ----------
  const utpIssues = await sp.web.lists
    .getByTitle("UTP Tax Issue")
    .items.select(
      "Id",
      "RiskCategory",
      "EBITDA",
      "GrossTaxExposure",
      "ContigencyNote",
      "ProvisionGLCode",
      "UTP/Id"
    )
    .expand("UTP")();

  // ---------- STEP 4: Group Issues by UTP SharePoint Id ----------
  const issuesByUtp = utpIssues.reduce((acc: any, issue: any) => {
    const utpId = issue.UTP?.Id;
    if (!utpId) return acc;
    if (!acc[utpId]) acc[utpId] = [];
    acc[utpId].push(issue);
    return acc;
  }, {});

  // ---------- STEP 5: Build Results ----------
  const results: any[] = [];

  for (const [utpId, { current, previous }] of Object.entries(latestByMonth) as [string, { current?: any; previous?: any }][]) {
   
    const currentIssues = current ? issuesByUtp[current?.Id] || [] : [];
    const previousIssues = previous ? issuesByUtp[previous?.Id] || [] : [];
    const maxLength = Math.max(currentIssues.length, previousIssues.length);

    for (let i = 0; i < maxLength; i++) {
      const currIssue = currentIssues[i];
      const prevIssue = previousIssues[i];

      // Only count Probable cases
      const currAmt =
        currIssue && currIssue.RiskCategory === "Probable"
          ? currIssue.GrossTaxExposure || 0
          : 0;
      const prevAmt =
        prevIssue && prevIssue.RiskCategory === "Probable"
          ? prevIssue.GrossTaxExposure || 0
          : 0;

      if (currAmt === 0 && prevAmt === 0) continue;

      results.push({
        utpId,
        glCode: currIssue?.ProvisionGLCode || prevIssue?.ProvisionGLCode || "",
        taxType:
          current?.CaseNumber?.CorrespondenceType ||
          previous?.CaseNumber?.CorrespondenceType ||
          "",
        provisionType: currIssue?.EBITDA || prevIssue?.EBITDA || "",
        entity:
          current?.CaseNumber?.Entity || previous?.CaseNumber?.Entity || "",
        currentMonthAmount: currAmt,
        previousMonthAmount: prevAmt,
        variance: currAmt - prevAmt,
      });
    }
  }


  // ---------- STEP 6: Group & Subtotal ----------
  const groupedByTaxType = results.reduce((acc: any, r) => {
    const provisionType = r.provisionType || "Unknown";
    if (!acc[provisionType]) acc[provisionType] = [];
    acc[provisionType].push(r);
    return acc;
  }, {});

  const exportData: any[] = [];
  let grandCurr = 0;
  let grandPrev = 0;

  for (const [taxType, items] of Object.entries(groupedByTaxType) as [string, any[]][]) {
    let subtotalCurr = 0;
    let subtotalPrev = 0;
console.log(taxType);

    items.forEach((r: any) => {
      subtotalCurr += r.currentMonthAmount;
      subtotalPrev += r.previousMonthAmount;

      exportData.push({
        utpId: r.utpId,
        glCode: r.glCode,
        taxType: r.taxType,
        provisionType: r.provisionType,
        entity: r.entity,
        currentMonthAmount: formatAmount(r.currentMonthAmount),
        previousMonthAmount: formatAmount(r.previousMonthAmount),
        variance: formatAmount(r.variance),
      });
    });

    exportData.push({
      utpId: "",
      glCode: "",
      provisionType: "",
      entity: "Sub Total",
      currentMonthAmount: formatAmount(subtotalCurr),
      previousMonthAmount: formatAmount(subtotalPrev),
      variance: formatAmount(subtotalCurr - subtotalPrev),
    });

    grandCurr += subtotalCurr;
    grandPrev += subtotalPrev;
  }

  // ---------- STEP 7: Grand Total ----------
  exportData.push({
    utpId: "",
    glCode: "",
    taxType: "",
    provisionType: "",
    entity: "Grand Total",
    currentMonthAmount: formatAmount(grandCurr),
    previousMonthAmount: formatAmount(grandPrev),
    variance: formatAmount(grandCurr - grandPrev),
  });

  return exportData;
}






case "Provisions3": {
  const sp3 = spfi().using(SPFx(SpfxContext));

  // ---------- STEP 1: Determine effective period ----------
  const now = new Date();
  let effectiveCurrentMonth: number;
  let effectiveCurrentYear: number;
  let prevMonth: number;
  let prevYear: number;

  if (filter.dateStart) {
    const selectedMonth = new Date(filter.dateStart);
    effectiveCurrentMonth = selectedMonth.getMonth();
    effectiveCurrentYear = selectedMonth.getFullYear();
  } else if (filter.dateRangeStart && filter.dateRangeEnd) {
    const end = new Date(filter.dateRangeEnd);
    effectiveCurrentMonth = end.getMonth();
    effectiveCurrentYear = end.getFullYear();
  } else {
    effectiveCurrentMonth = now.getMonth();
    effectiveCurrentYear = now.getFullYear();
  }

  const prev = new Date(effectiveCurrentYear, effectiveCurrentMonth - 1, 1);
  prevMonth = prev.getMonth();
  prevYear = prev.getFullYear();

  // ---------- STEP 2: Fetch all RiskCategories together ----------
  const utpIssues3 = await sp3.web.lists
    .getByTitle("UTP Tax Issue")
    .items.filter(
      "RiskCategory eq 'Probable' or RiskCategory eq 'Possible' or RiskCategory eq 'Remote'"
    )
    .select(
      "Id",
      "RiskCategory",
      "GrossTaxExposure",
      "PaymentType",
      "Amount",
      "PLExposure",
      "EBITDA",
      "UTP/Id",
      "UTP/UTPId",
      "UTP/UTPDate",
      "UTP/TaxType"
    )
    .expand("UTP")();

  // ---------- STEP 3: Get latest issue per UTPId for both current & previous month ----------
  const latestByMonth3 = utpIssues3.reduce((acc: any, issue: any) => {
    const id = issue.UTP?.UTPId;
    if (!id) return acc;

    const d = new Date(issue.UTP?.UTPDate);
    const month = d.getMonth();
    const year = d.getFullYear();

    if (!acc[id]) acc[id] = {};

    // Current month
    if (month === effectiveCurrentMonth && year === effectiveCurrentYear) {
      const curr = acc[id].current;
      if (
        !curr ||
        d > new Date(curr.UTP?.UTPDate) ||
        (d.getTime() === new Date(curr.UTP?.UTPDate).getTime() && issue.Id > curr.Id)
      ) {
        acc[id].current = issue;
      }
    }

    // Previous month
    else if (month === prevMonth && year === prevYear) {
      const prev = acc[id].previous;
      if (
        !prev ||
        d > new Date(prev.UTP?.UTPDate) ||
        (d.getTime() === new Date(prev.UTP?.UTPDate).getTime() && issue.Id > prev.Id)
      ) {
        acc[id].previous = issue;
      }
    }

    return acc;
  }, {});

  const latestIssues3 = Object.values(latestByMonth3)
    .flatMap(({ current, previous }: any) => [current, previous].filter(Boolean));

  // ---------- STEP 4: Add month/year ----------
  const merged3 = latestIssues3.map((r: any) => {
    const d = r?.UTP?.UTPDate ? new Date(r.UTP.UTPDate) : null;
    return {
      ...r,
      month: d ? d.getMonth() : null,
      year: d ? d.getFullYear() : null,
    };
  });

  // ---------- STEP 5: Helper ----------
  const sumBy = (arr: any[], month: number, year: number, condition?: (r: any) => boolean) =>
    arr
      .filter((r) => r.month === month && r.year === year && (!condition || condition(r)))
      .reduce((s, r) => s + (Number(r.Amount) || 0), 0);

  // ---------- STEP 6: Function to compute for each category ----------
  const calculateCategory = (category: string) => {
    const filtered = merged3.filter((r) => r.RiskCategory === category);

    const totalExposureCurr = filtered
      .filter((r) => r.month === effectiveCurrentMonth && r.year === effectiveCurrentYear)
      .reduce((s, r) => s + (Number(r.GrossTaxExposure) || 0), 0);

    const totalExposurePrev = filtered
      .filter((r) => r.month === prevMonth && r.year === prevYear)
      .reduce((s, r) => s + (Number(r.GrossTaxExposure) || 0), 0);

    const paymentsUnderProtestCurr = sumBy(
      filtered,
      effectiveCurrentMonth,
      effectiveCurrentYear,
      (r) => r.PaymentType === "Payment under Protest"
    );
    const paymentsUnderProtestPrev = sumBy(
      filtered,
      prevMonth,
      prevYear,
      (r) => r.PaymentType === "Payment under Protest"
    );

    const admittedTaxCurr = sumBy(
      filtered,
      effectiveCurrentMonth,
      effectiveCurrentYear,
      (r) => r.PaymentType === "Admitted Tax"
    );
    const admittedTaxPrev = sumBy(
      filtered,
      prevMonth,
      prevYear,
      (r) => r.PaymentType === "Admitted Tax"
    );

    const cashflowCurr = totalExposureCurr - paymentsUnderProtestCurr - admittedTaxCurr;
    const cashflowPrev = totalExposurePrev - paymentsUnderProtestPrev - admittedTaxPrev;

    const plCurr = filtered
      .filter((r) => r.month === effectiveCurrentMonth && r.year === effectiveCurrentYear)
      .reduce((s, r) => s + (r?.RiskCategory === "Probable" ? 0 : Number(r.GrossTaxExposure) || 0), 0);

    const plPrev = filtered
      .filter((r) => r.month === prevMonth && r.year === prevYear)
      .reduce((s, r) => s + (r?.RiskCategory === "Probable" ? 0 : Number(r.GrossTaxExposure) || 0), 0);

    const ebitdaCurr = filtered
      .filter((r) => r.month === effectiveCurrentMonth && r.year === effectiveCurrentYear)
      .reduce(
        (s, r) => s + (r?.UTP?.TaxType === "Income Tax" ? 0 : Number(r.GrossTaxExposure) || 0),
        0
      );

    const ebitdaPrev = filtered
      .filter((r) => r.month === prevMonth && r.year === prevYear)
      .reduce(
        (s, r) => s + (r?.UTP?.TaxType === "Income Tax" ? 0 : Number(r.GrossTaxExposure) || 0),
        0
      );

    return [
      {
        label: `Total Exposure (${category}) only`,
        current: formatAmount(totalExposureCurr),
        prior: formatAmount(totalExposurePrev),
        variance: formatAmount(totalExposureCurr - totalExposurePrev),
      },
      {
        label: `Less – Payments under Protest `,
        current: formatAmount(paymentsUnderProtestCurr),
        prior: formatAmount(paymentsUnderProtestPrev),
        variance: formatAmount(paymentsUnderProtestCurr - paymentsUnderProtestPrev),
      },
      {
        label: `Less - Admitted Tax `,
        current: formatAmount(admittedTaxCurr),
        prior: formatAmount(admittedTaxPrev),
        variance: formatAmount(admittedTaxCurr - admittedTaxPrev),
      },
      {
        label: `Cashflow Exposure `,
        current: formatAmount(cashflowCurr),
        prior: formatAmount(cashflowPrev),
        variance: formatAmount(cashflowCurr - cashflowPrev),
      },
      {
        label: `P&L Exposure `,
        current: formatAmount(plCurr),
        prior: formatAmount(plPrev),
        variance: formatAmount(plCurr - plPrev),
      },
      {
        label: `EBITDA Exposure (PKR) `,
        current: formatAmount(ebitdaCurr),
        prior: formatAmount(ebitdaPrev),
        variance: formatAmount(ebitdaCurr - ebitdaPrev),
      },
      { label: "", current: "", prior: "", variance: "" },
    ];
  };

  // ---------- STEP 7: Flatten results ----------
  const results3 = [
    ...calculateCategory("Probable"),
    ...calculateCategory("Possible"),
    ...calculateCategory("Remote"),
  ];

  return results3;
}



case "Provisions2": {
  const sp = spfi().using(SPFx(SpfxContext));

  // ---------- STEP 1: Determine effective current month ----------
  const now = new Date();
  let effectiveCurrentMonth: number;
  let effectiveCurrentYear: number;

  if (filter.dateStart) {
    const selectedMonth = new Date(filter.dateStart);
    effectiveCurrentMonth = selectedMonth.getMonth();
    effectiveCurrentYear = selectedMonth.getFullYear();
  } else if (filter.dateRangeStart && filter.dateRangeEnd) {
    const end = new Date(filter.dateRangeEnd);
    effectiveCurrentMonth = end.getMonth();
    effectiveCurrentYear = end.getFullYear();
  } else {
    effectiveCurrentMonth = now.getMonth();
    effectiveCurrentYear = now.getFullYear();
  }

  // ---------- STEP 2: Pick latest UTP per current month ----------
  const latestCurrentMonth = rawData.reduce((acc: any, utp: any) => {
    const d = new Date(utp.UTPDate);
    const month = d.getMonth();
    const year = d.getFullYear();
    const id = utp.UTPId;
    if (!id) return acc;

    if (month === effectiveCurrentMonth && year === effectiveCurrentYear) {
      const existing = acc[id];
      if (
        !existing ||
        d > new Date(existing.UTPDate) ||
        (d.getTime() === new Date(existing.UTPDate).getTime() && utp.Id > existing.Id)
      ) {
        acc[id] = utp;
      }
    }

    return acc;
  }, {});

  // ---------- STEP 3: Fetch UTP Tax Issues (GRS from here) ----------
  const utpIssues = await sp.web.lists
    .getByTitle("UTP Tax Issue")
    .items.select(
      "Id",
      "RiskCategory",
      "EBITDA",
      "GrossTaxExposure",
      "GRSCode",
      "UTP/Id"
    )
    .expand("UTP")();

  // ---------- STEP 4: Group Issues by UTP Id ----------
  const issuesByUtp = utpIssues.reduce((acc: any, issue: any) => {
    const utpId = issue.UTP?.Id;
    if (!utpId) return acc;
    if (!acc[utpId]) acc[utpId] = [];
    acc[utpId].push(issue);
    return acc;
  }, {});

  // ---------- STEP 5: Build flat results ----------
  const results: any[] = [];
  let grandCurr = 0;

  for (const [utpId, current] of Object.entries(latestCurrentMonth) as [string, any][]) {
    const issues = issuesByUtp[current?.Id] || [];

    for (const issue of issues) {
      // only probable cases
      if (issue.RiskCategory !== "Probable") continue;

      const currAmt = issue.GrossTaxExposure || 0;
      if (currAmt === 0) continue;

      grandCurr += currAmt;

      results.push({
        utpId,
        GRSCode: issue.GRSCode || "",
       taxMatter: current?.CaseNumber?.CorrespondenceType || "",
                taxType: current?.CaseNumber?.TaxType || "", 
        entity: current?.CaseNumber?.Entity || "",
        GrossExposure: formatAmount(currAmt),
       
      });
    }
  }

  // ---------- STEP 6: Add grand total ----------
  results.push({
      GRSCode: "",
          taxMatter: "",
          entity: "Sub Total",
          taxType: "",
    GrossExposure: formatAmount(grandCurr),
   
  });

  return results;
}


case "Contingencies": {
  const sp = spfi().using(SPFx(SpfxContext));

  // ---------- STEP 1: Determine effective period ----------
  const now = new Date();
  let effectiveCurrentMonth: number;
  let effectiveCurrentYear: number;
  let prevMonth: number;
  let prevYear: number;

  if (filter.dateStart) {
    const selectedMonth = new Date(filter.dateStart);
    effectiveCurrentMonth = selectedMonth.getMonth();
    effectiveCurrentYear = selectedMonth.getFullYear();
  } else if (filter.dateRangeStart && filter.dateRangeEnd) {
    const end = new Date(filter.dateRangeEnd);
    effectiveCurrentMonth = end.getMonth();
    effectiveCurrentYear = end.getFullYear();
  } else {
    effectiveCurrentMonth = now.getMonth();
    effectiveCurrentYear = now.getFullYear();
  }

  const prev = new Date(effectiveCurrentYear, effectiveCurrentMonth - 1, 1);
  prevMonth = prev.getMonth();
  prevYear = prev.getFullYear();

  // ---------- STEP 2: Pick latest UTP per month ----------
  const latestByMonth = rawData.reduce((acc: any, utp: any) => {
    const d = new Date(utp.UTPDate);
    const month = d.getMonth();
    const year = d.getFullYear();
    const id = utp.UTPId;
    if (!id) return acc;
    if (!acc[id]) acc[id] = {};

    if (month === effectiveCurrentMonth && year === effectiveCurrentYear) {
      const curr = acc[id].current;
      if (
        !curr ||
        d > new Date(curr.UTPDate) ||
        (d.getTime() === new Date(curr.UTPDate).getTime() && utp.Id > curr.Id)
      ) {
        acc[id].current = utp;
      }
    } else if (month === prevMonth && year === prevYear) {
      const prevU = acc[id].previous;
      if (
        !prevU ||
        d > new Date(prevU.UTPDate) ||
        (d.getTime() === new Date(prevU.UTPDate).getTime() && utp.Id > prevU.Id)
      ) {
        acc[id].previous = utp;
      }
    }

    return acc;
  }, {});

  // ---------- STEP 3: Fetch UTP Tax Issues + GL Code ----------
  const utpIssues = await sp.web.lists
    .getByTitle("UTP Tax Issue")
    .items.select(
      "Id",
      "RiskCategory",
      "EBITDA",
      "GrossTaxExposure",
      "ContigencyNote",
      "ProvisionGLCode",
      "UTP/Id"
    )
    .expand("UTP")();

  // ---------- STEP 4: Group Issues by UTP SharePoint Id ----------
  const issuesByUtp = utpIssues.reduce((acc: any, issue: any) => {
    const utpId = issue.UTP?.Id;
    if (!utpId) return acc;
    if (!acc[utpId]) acc[utpId] = [];
    acc[utpId].push(issue);
    return acc;
  }, {});

  // ---------- STEP 5: Build Flat Results ----------
  const results: any[] = [];
  let grandCurr = 0;
  let grandPrev = 0;

  for (const [utpId, { current, previous }] of Object.entries(latestByMonth) as [string, { current?: any; previous?: any }][]) {
    const currentIssues = current ? issuesByUtp[current?.Id] || [] : [];
    const previousIssues = previous ? issuesByUtp[previous?.Id] || [] : [];
    const maxLength = Math.max(currentIssues.length, previousIssues.length);

    for (let i = 0; i < maxLength; i++) {
      const currIssue = currentIssues[i];
      const prevIssue = previousIssues[i];

      const currAmt = currIssue?.GrossTaxExposure || 0;
      const prevAmt = prevIssue?.GrossTaxExposure || 0;

      if (currAmt === 0 && prevAmt === 0) continue;

      grandCurr += currAmt;
      grandPrev += prevAmt;

      results.push({
        utpId,
        glCode: currIssue?.ProvisionGLCode || prevIssue?.ProvisionGLCode || "",
        taxType:
          current?.CaseNumber?.CorrespondenceType ||
          previous?.CaseNumber?.CorrespondenceType ||
          "",
        entity:
          current?.CaseNumber?.Entity || previous?.CaseNumber?.Entity || "",
        currentMonthAmount: formatAmount(currAmt),
        previousMonthAmount: formatAmount(prevAmt),
        variance: formatAmount(currAmt - prevAmt),
      });
    }
  }

  // ---------- STEP 6: Add Grand Total ----------
  results.push({
    utpId: "",
    glCode: "",
    taxType: "",
    entity: "Grand Total",
    currentMonthAmount: formatAmount(grandCurr),
    previousMonthAmount: formatAmount(grandPrev),
    variance: formatAmount(grandCurr - grandPrev),
  });

  return results;
}

      case "ERM":
        return rawData.map((item) => ({
          UTPDate: item.UTPDate,
          category: item.RiskCategory, // exists
          fy: item.FinancialYear, // exists but null
          taxYear: item.TaxYear, // exists but null
          taxAuthority: item.TaxAuthority, // ❌ not in data (will be undefined)
          taxType: item.TaxType, // exists
          entity: item.Entity, // exists but null

          currentMonthAmount: item.GrossExposure || 0, // Exposure Amount (FCY)
          variance: 280 as any, // Example static Exchange Rate (replace with real field if exists)
          previousMonthAmount: item.CashFlowExposure || 0, // Exposure Amount (PKR)
        }));
      default: // UTPData
        const sp = spfi().using(SPFx(SpfxContext));
        let utpQuery = sp.web.lists
          .getByTitle("UTP Tax Issue")
          .items.expand("UTP")
          .select("*,UTP/Id,UTP/Title");

        if (filter.category) {
          // ✅ Apply filter only when risk category is selected
          utpQuery = utpQuery.filter(`RiskCategory eq '${filter.category}'`);
        }
        const utpIssues = await utpQuery();
        const latestIssues = await getLatestUTPIssues(rawData);
        const merged = latestIssues.flatMap((utp: any) => {
          const mainRow = {
            ...utp,
            utpId: utp.UTPId, // exists (currently null in your data)
            mlrClaimId: utp.GMLRID, // mapping from GMLRID
            pendingAuthority: utp?.CaseNumber?.PendingAuthority, // exists but null
            type: utp.PaymentType, // exists but null
            grossExposureJul: formatAmount(utp.GrossExposure), // only one field, reusing
            grossExposureJun: formatAmount(utp.GrossExposure),
            UTPDate: utp.UTPDate,
            category: utp.RiskCategory, // exists
            fy: utp?.CaseNumber?.FinancialYear, // exists but null
            taxYear: utp?.CaseNumber?.TaxYear, // exists but null
            taxAuthority: utp?.CaseNumber?.TaxAuthority, // ❌ not in data (will be undefined)
            taxMatter: utp?.CaseNumber?.CorrespondenceType, // ❌ not in data (will be undefined)
            taxType: utp?.CaseNumber?.TaxType, // exists
            entity: utp?.CaseNumber?.Entity, // exists but null

            varianceLastMonth: formatAmount(utp.VarianceWithLastMonthPKR), // ❌ not in data (undefined)
            grossExposureMay: formatAmount(utp.GrossExposure),
            grossExposureApr: formatAmount(utp.GrossExposure),
            arcTopTaxRisk: utp.ARCtopTaxRisksReporting, // ❌ not in data (undefined)
            contingencyNote: utp.ContigencyNote, // exists but null (be careful: property is "ContigencyNote" with missing 'n')
            briefDescription: utp?.CaseNumber?.BriefDescription, // exists but null
            provisionGlCode: utp.ProvisionGLCode, // ❌ not in data (undefined)
            provisionGrsCode: utp.GRSCode, // exists
            paymentUnderProtest:
              utp.PaymentType == "Payment under Protest" ? utp.Amount : "", // exists but null (note lowercase "u")
            admittedTax: utp.PaymentType == "Admitted Tax" ? utp.Amount : "", // exists but null (note lowercase "u")

            paymentGlCode: utp.PaymentGLCode, // ❌ not in data (undefined)
            utpPaperCategory: utp.UTPCategory, // exists but null
            provisionsContingencies: utp.ProvisionsContingencies, // ❌ not in data (undefined)

            utpIdDisplay: utp.Id,
            utpIssue: "",
            ermCategory: utp.ERMCategory ?? "",
            plExposurePKR: formatAmount(
              utp.RiskCategory === "Probable" ? 0 : utp.GrossExposure || 0
            ),
            ebitdaExposurePKR: formatAmount(
              utp.CaseNumber?.TaxType === "Income Tax"
                ? 0
                : utp.RiskCategory === "Probable"
                  ? 0
                  : utp.GrossExposure || 0
            ),
            cashFlowExposurePKR: formatAmount(
              (utp.GrossExposure || 0) - utp.Amount || 0
            ),

            ermUniqueNumbering: utp.ERMUniqueNumbering ?? "",
            caseNumber: utp?.CaseNumber?.Title || "",
          };

          const relatedIssues = utpIssues.filter(
            (issue) => issue.UTPId === utp.Id
          );
          console.log(utp.Id, utpIssues, rawData,latestIssues, relatedIssues, 'dekhloo');

          if (relatedIssues.length === 0) return [mainRow];

          const issueRows = relatedIssues.map((issue, index) => ({
            ...utp,
            utpId: `${utp.UTPId}-${String.fromCharCode(97 + index)}`, // exists (currently null in your data)
            mlrClaimId: utp.GMLRID, // mapping from GMLRID
            pendingAuthority: utp?.CaseNumber?.PendingAuthority, // exists but null
            type: utp.PaymentType, // exists but null
            grossExposureJul: utp.GrossExposure, // only one field, reusing
            grossExposureJun: formatAmount(issue.GrossTaxExposure) ?? 0,
            UTPDate: utp.UTPDate,
            category: issue.RiskCategory, // exists
            fy: utp?.CaseNumber?.FinancialYear, // exists but null
            taxYear: utp?.CaseNumber?.TaxYear, // exists but null
            taxAuthority: utp?.CaseNumber?.TaxAuthority,
            taxMatter: utp?.CaseNumber?.CorrespondenceType, // ❌ not in data (will be undefined)
            taxType: utp?.CaseNumber?.TaxType, // exists
            entity: utp?.CaseNumber?.Entity, // exists but null

            varianceLastMonth: utp.VarianceWithLastMonthPKR, // ❌ not in data (undefined)
            grossExposureMay: formatAmount(utp.GrossExposure),
            grossExposureApr: formatAmount(utp.GrossExposure),
            arcTopTaxRisk: utp.ARCtopTaxRisksReporting, // ❌ not in data (undefined)

            contingencyNote: issue.ContigencyNote, // exists but null (be careful: property is "ContigencyNote" with missing 'n')
            briefDescription: utp?.CaseNumber?.BriefDescription, // exists but null
            provisionGlCode: issue.ProvisionGLCode, // ❌ not in data (undefined)
            provisionGrsCode: issue.GRSCode, // exists
            paymentUnderProtest:
              issue.PaymentType == "Payment under Protest"
                ? formatAmount(issue.Amount)
                : "", // exists but null (note lowercase "u")
            admittedTax:
              issue.PaymentType == "Admitted Tax"
                ? formatAmount(issue.Amount)
                : "", // exists but null (note lowercase "u")
            // exists but null (note lowercase "u")
            paymentGlCode: issue.PaymentGLCode, // ❌ not in data (undefined)
            utpPaperCategory: issue.UTPCategory, // exists but null
            provisionsContingencies: utp.ProvisionsContingencies, // ❌ not in data (undefined)

            utpIssue: issue.Title ?? "",
            amtContested: formatAmount(issue.AmountContested) ?? "",
            rate: issue.Rate ?? "",
            ermCategory: issue.ERMCategory ?? "",
            plExposurePKR: formatAmount(
              issue.RiskCategory === "Probable"
                ? 0
                : issue.GrossTaxExposure || 0
            ),
            ebitdaExposurePKR: formatAmount(
              utp.CaseNumber?.TaxType === "Income Tax"
                ? 0
                : issue.RiskCategory === "Probable"
                  ? 0
                  : issue.GrossTaxExposure || 0
            ),
            cashFlowExposurePKR: formatAmount(
              (issue.GrossTaxExposure || 0) - issue.Amount || 0
            ),

            ermUniqueNumbering: utp.ERMUniqueNumbering ?? "",
            caseNumber: utp?.CaseNumber?.Title || "",
          }));

          // return [mainRow, ...issueRows];
          return [...issueRows];
        });

        return merged;
    }
  };

  const getListName = async(type: ReportType) => {
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
    let items_updated=[];
    let items: any[] = [];
    try {
      const listName = await getListName(reportType);
      if (listName === "UTPData") {
        // 1️⃣ Fetch UTPData items and expand CaseNumber lookup
        items = await sp.web.lists
          .getByTitle(listName)
          .items.select(
            "*",
            "CaseNumber/Id",
            "CaseNumber/Title",
            "CaseNumber/TaxAuthority",
            "CaseNumber/PendingAuthority",
            "CaseNumber/Entity",
            "CaseNumber/CorrespondenceType",
            "CaseNumber/TaxType",
            "CaseNumber/FinancialYear",
            "CaseNumber/TaxYear"
          )
          .expand("CaseNumber")
          .filter(` ApprovalStatus eq 'Approved'`)();

        // 2️⃣ Extract unique Case IDs (no Set used)
        const caseIdsArray = items
          .map((i) => i?.CaseNumber?.Id)
          .filter((id) => id !== undefined && id !== null);

        const caseIds = caseIdsArray.filter(
          (id, index) => caseIdsArray.indexOf(id) === index
        );

        if (caseIds.length > 0) {
          // 3️⃣ Build filter string like: Id eq 1 or Id eq 2 or Id eq 3
          const caseFilter = caseIds.map((id) => `Id eq ${id}`).join(" or ");

          // 4️⃣ Fetch BriefDescription separately from Cases list
          const caseDetails = await sp.web.lists
            .getByTitle("Cases")
            .items.select("Id", "BriefDescription")
            .filter(`${caseFilter}`)();

          // 5️⃣ Merge BriefDescription into UTPData items
          items = items.map((item) => {
            const caseDetail = caseDetails.find(
              (c) => c.Id === item?.CaseNumber?.Id
            );
            return {
              ...item,
              CaseNumber: {
                ...item.CaseNumber,
                BriefDescription: caseDetail ? caseDetail.BriefDescription : "",
              },
            };
          });
          const utpTaxIssues = await sp.web.lists
            .getByTitle("UTP Tax Issue")
            .items.select("Id", "UTP/Id", "RiskCategory")
            .expand("UTP")();
          const riskMap = utpTaxIssues.reduce((acc, issue) => {
            const utpId = issue?.UTP?.Id;
            if (!utpId) return acc;
            if (!acc[utpId]) acc[utpId] = [];
            if (!acc[utpId].includes(issue.RiskCategory)) {
              acc[utpId].push(issue.RiskCategory);
            }
            return acc;
          }, {} as Record<number, string[]>);

          // ✅ 8️⃣ Attach RiskCategoryList to each item
          items = items.map((item) => ({
            ...item,
            RiskCategoryList: riskMap[item.Id] || [],
          }));
        }
      } else {
        items = await sp.web.lists
          .getByTitle(listName)
          .items.filter(` ApprovalStatus eq 'Approved'`)();
      }
      if (reportType === "ActiveCases") {
        const today = new Date();
        const next30 = new Date();
        next30.setDate(today.getDate() + 30);

        // ✅ Construct UTC dates so .toISOString() won't shift days
        const startUTC = new Date(
          Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
        );
        const endUTC = new Date(
          Date.UTC(next30.getFullYear(), next30.getMonth(), next30.getDate())
        );

        const newStart = startUTC.toISOString().split("T")[0]; // YYYY-MM-DD
        const newEnd = endUTC.toISOString().split("T")[0]; // YYYY-MM-DD

        handleFilterChangeDate2(newStart, newEnd, items);
      } else {

        items_updated = await normalizeData(reportType, items, "");
        setFilteredData(items_updated);
      }
      setData(items);
      // start unfiltered
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false); // stop loading
    }
  };
useEffect(() => {
  let isActive = true; // ✅ track if this effect is still active

  const runFetch = async () => {
    // Reset before fetch
    const reset = {
      dateStart: "",
      dateEnd: "",
      dateRangeStart: "",
      dateRangeEnd: "",
      category: "",
      financialYear: "",
      taxYear: "",
      taxType: "",
      taxAuthority: "",
      entity: "",
    };

    setSelectedDate(null);
    setDateRange([null, null]);
    setFilters(reset);
    setData([]);
    setFilteredData([]);

    setLoading(true);

    try {
      await fetchData();
    } catch (error) {
      if (isActive) console.error(error);
    } finally {
      if (isActive) setLoading(false);
    }
  };

  runFetch();

  // ✅ Cleanup to cancel outdated fetch results
  return () => {
    isActive = false;
  };
}, [reportType]);


  useEffect(() => {
    const fetchLOVs = async () => {
      const items = await sp.web.lists
        .getByTitle("LOVData1")
        .items.select("Id", "Title", "Value", "Status")
        .top(5000)();
      const activeItems = items.filter((item) => item.Status === "Active");
      const grouped: { [key: string]: IDropdownOption[] } = {};
      activeItems.forEach((item) => {
        if (!grouped[item.Title]) grouped[item.Title] = [];
        grouped[item.Title].push({
          key: item.Value,
          text: item.Value,
        });
      });
      setLovOptions(grouped);
    };

    fetchLOVs();
  }, []);
const handleFilterChange = async (key: string, value: string) => {
  const updatedFilters = { ...filters, [key]: value };
  setFilters(updatedFilters);

  const normalizeDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // STEP 1: Date filter (if selected)
  let workingData = [...data];
  if (updatedFilters.dateRangeStart || updatedFilters.dateRangeEnd) {
    const start = updatedFilters.dateRangeStart
      ? normalizeDate(new Date(updatedFilters.dateRangeStart))
      : null;
    const end = updatedFilters.dateRangeEnd
      ? normalizeDate(new Date(updatedFilters.dateRangeEnd))
      : null;

    workingData = data.filter((item) => {
      let itemDate: Date | null = null;

      if (reportType === "Litigation") {
        itemDate = item.DateReceived ? normalizeDate(new Date(item.DateReceived)) : null;
      } else if (reportType === "ActiveCases") {
        itemDate = item.DateofCompliance ? normalizeDate(new Date(item.DateofCompliance)) : null;
      } else {
        itemDate = item.UTPDate ? normalizeDate(new Date(item.UTPDate)) : null;
      }

      if (!itemDate) return false;
      if (start && itemDate < start) return false;
      if (end && itemDate > end) return false;
      return true;
    });
  }

  // STEP 2: Apply latest logic (based on reportType)
  let latestData: any[] = [];
  if (
    ["UTP", "Provisions1", "Provisions2", "Provisions3", "Contingencies", "ERM"].includes(reportType)
  ) {
    latestData = await getLatestUTPIssues(workingData);
  } else if (["Litigation", "ActiveCases"].includes(reportType)) {
    latestData = await getLatestCaseIssues(workingData);
  } else {
    latestData = workingData;
  }

  // STEP 3: Apply other filters
  const filtered = latestData.filter((item) => {
    if (
      [
        "UTP",
        "Provisions1",
        "Provisions2",
        "Provisions3",
        "Contingencies",
        "ERM",
      ].includes(reportType)
    ) {
      return (
        (!updatedFilters.category ||
          item.RiskCategoryList?.includes(updatedFilters.category)) &&
        (!updatedFilters.financialYear ||
          item.CaseNumber?.FinancialYear === updatedFilters.financialYear) &&
        (!updatedFilters.taxYear ||
          item.CaseNumber?.TaxYear === updatedFilters.taxYear) &&
        (!updatedFilters.taxType ||
          item.CaseNumber?.TaxType === updatedFilters.taxType) &&
        (!updatedFilters.entity ||
          item.CaseNumber?.Entity === updatedFilters.entity)
      );
    }

    if (["Litigation", "ActiveCases"].includes(reportType)) {
      return (
        (!updatedFilters.taxYear ||
          item.TaxYear === updatedFilters.taxYear) &&
        (!updatedFilters.taxAuthority ||
          item.TaxAuthority === updatedFilters.taxAuthority) &&
        (!updatedFilters.entity || item.Entity === updatedFilters.entity) &&
        (!updatedFilters.financialYear ||
          item.FinancialYear === updatedFilters.financialYear) &&
        (!updatedFilters.taxType || item.TaxType === updatedFilters.taxType)
      );
    }

    return true;
  });

  setLoading(true);
  const dataf = await normalizeData(reportType, filtered, updatedFilters);
  setFilteredData(dataf);
  setLoading(false);
};

const handleFilterChangeDate = async (value1: string, value2: string) => {
  const updatedFilters = { ...filters, dateStart: value1, dateEnd: value2 };
  setFilters(updatedFilters);

  // STEP 1: Filter by date range (month selector)
  let workingData = data;
  if (value1 || value2) {
    const startDate = value1 ? new Date(value1) : null;
    const endDate = value2 ? new Date(value2) : null;

    workingData = data.filter((item) => {
      const itemDateRaw =
        reportType === "Litigation"
          ? item.DateReceived
          : reportType === "ActiveCases"
          ? item.DateofCompliance
          : item.UTPDate;

      const itemDate = itemDateRaw ? new Date(itemDateRaw) : null;
      if (!itemDate) return false;
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  }

  // STEP 2: Apply latest version logic
  let latestData: any[] = [];
  if (
    ["UTP", "Provisions1", "Provisions2", "Provisions3", "Contingencies", "ERM"].includes(reportType)
  ) {
    latestData = await getLatestUTPIssues(workingData);
  } else if (["Litigation", "ActiveCases"].includes(reportType)) {
    latestData = await getLatestCaseIssues(workingData);
  } else {
    latestData = workingData;
  }

  // STEP 3: Apply other filters (category, tax year, etc.)
  const filtered = latestData.filter((item) => {
    switch (reportType) {
      case "UTP":
      case "Provisions1":
      case "Provisions2":
      case "Provisions3":
      case "Contingencies":
      case "ERM":
        return (
          (!updatedFilters.category ||
            item.RiskCategoryList?.includes(updatedFilters.category)) &&
          (!updatedFilters.financialYear ||
            item.CaseNumber?.FinancialYear === updatedFilters.financialYear) &&
          (!updatedFilters.taxYear ||
            item.CaseNumber?.TaxYear === updatedFilters.taxYear) &&
          (!updatedFilters.taxType ||
            item.CaseNumber?.TaxType === updatedFilters.taxType) &&
          (!updatedFilters.entity ||
            item.CaseNumber?.Entity === updatedFilters.entity)
        );

      case "Litigation":
      case "ActiveCases":
        return (
          (!updatedFilters.taxYear ||
            item.TaxYear === updatedFilters.taxYear) &&
          (!updatedFilters.taxAuthority ||
            item.TaxAuthority === updatedFilters.taxAuthority) &&
          (!updatedFilters.entity || item.Entity === updatedFilters.entity) &&
          (!updatedFilters.financialYear ||
            item.FinancialYear === updatedFilters.financialYear) &&
          (!updatedFilters.taxType || item.TaxType === updatedFilters.taxType)
        );

      default:
        return true;
    }
  });

  setLoading(true);
  const dataf = await normalizeData(reportType, filtered, updatedFilters);
  setFilteredData(dataf);
  setLoading(false);
};

const handleFilterChangeDate2 = async (value1: string, value2: string, data2: any) => {
  const updatedFilters = { ...filters, dateStart: value1, dateEnd: value2 };
  setFilters(updatedFilters);

  // STEP 1: Filter by date range
  let workingData = data2;
  if (value1 || value2) {
    const startDate = value1 ? new Date(value1) : null;
    const endDate = value2 ? new Date(value2) : null;

    workingData = data2.filter((item: any) => {
      const itemDate = item.DateofCompliance ? new Date(item.DateofCompliance) : null;
      if (!itemDate) return false;
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  }

  // STEP 2: Apply latest version logic
  let latestData: any[] = [];
  if (
    ["UTP", "Provisions1", "Provisions2", "Provisions3", "Contingencies", "ERM"].includes(reportType)
  ) {
    latestData = await getLatestUTPIssues(workingData);
  } else if (["Litigation", "ActiveCases"].includes(reportType)) {
    latestData =await getLatestCaseIssues(workingData);
  } else {
    latestData = workingData;
  }

  // STEP 3: Apply other filters
  const filtered = latestData.filter((item) => {
    switch (reportType) {
      case "UTP":
      case "Provisions1":
      case "Provisions2":
      case "Provisions3":
      case "Contingencies":
      case "ERM":
        return (
          (!updatedFilters.category ||
            item.RiskCategoryList?.includes(updatedFilters.category)) &&
          (!updatedFilters.financialYear ||
            item.CaseNumber?.FinancialYear === updatedFilters.financialYear) &&
          (!updatedFilters.taxYear ||
            item.CaseNumber?.TaxYear === updatedFilters.taxYear) &&
          (!updatedFilters.taxType ||
            item.CaseNumber?.TaxType === updatedFilters.taxType) &&
          (!updatedFilters.entity ||
            item.CaseNumber?.Entity === updatedFilters.entity)
        );

      case "Litigation":
      case "ActiveCases":
        return (
          (!updatedFilters.taxYear ||
            item.TaxYear === updatedFilters.taxYear) &&
          (!updatedFilters.taxAuthority ||
            item.TaxAuthority === updatedFilters.taxAuthority) &&
          (!updatedFilters.entity || item.Entity === updatedFilters.entity) &&
          (!updatedFilters.financialYear ||
            item.FinancialYear === updatedFilters.financialYear) &&
          (!updatedFilters.taxType || item.TaxType === updatedFilters.taxType)
        );

      default:
        return true;
    }
  });

  setLoading(true);
  const dataf = await normalizeData(reportType, filtered, updatedFilters);
  setFilteredData(dataf);
  setLoading(false);
};


  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = ["Litigation", "UTP", "ActiveCases"].includes(
    reportType
  )
    ? filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
    : filteredData;

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
            {" "}
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
                  dateRangeStart: newStart,
                  dateRangeEnd: newEnd,
                  dateStart: "",
                  dateEnd: "",
                }));
                setSelectedDate(null);
                // Only apply filters that actually exist
                if (update[0]) handleFilterChange("dateRangeStart", newStart);
                if (update[1]) handleFilterChange("dateRangeEnd", newEnd);

                // If both are cleared
                if (!update[0] && !update[1]) {
                  handleFilterChange("dateRangeStart", "");
                  handleFilterChange("dateRangeEnd", "");
                }
              }}
              // isClearable
              placeholderText="Select date range"
              className={styles.datePickerInput} // ✅ custom height class
              calendarClassName={styles.customCalendar}
              dayClassName={(date) =>
                startDate && endDate && date >= startDate && date <= endDate
                  ? `${styles.customDay} ${styles.inRange}`
                  : styles.customDay
              }
              isClearable={false}
            />
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}> Month and Year</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => {
                setSelectedDate(date);
                if (date) {
                  const updatedFilters = {
                    ...filters,
                    dateRangeStart: "",
                    dateRangeEnd: "",
                  };
                  setFilters(updatedFilters);
                  setDateRange([null, null]);
                  const startUTC = new Date(
                    Date.UTC(date.getFullYear(), date.getMonth(), 1)
                  );
                  const endUTC = new Date(
                    Date.UTC(date.getFullYear(), date.getMonth() + 1, 0)
                  );
                  const newStart = startUTC.toISOString().split("T")[0];
                  const newEnd = endUTC.toISOString().split("T")[0];

                  handleFilterChangeDate(newStart, newEnd);
                } else {
                  handleFilterChangeDate("", "");
                }
              }}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              className={styles.datePickerInput}
              placeholderText="Select month and year"
            />
          </div>    {reportType !== "Provisions3" && (<>
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
          {(reportType == "Litigation" || reportType == "ActiveCases") && (
            <Dropdown
              label="Tax Authority"
              placeholder="Select Tax Authority"
              options={lovOptions["Tax Authority"] || []}
              selectedKey={filters.taxAuthority || null}
              onChange={(_, option) =>
                handleFilterChange("taxAuthority", option?.key as string)
              }
              styles={{ root: { minWidth: 160 } }}
            />
          )}

          <ComboBox
            label="Tax Year"
            placeholder="Select Tax Year"
            options={getYearOptions() || []} // should return IComboBoxOption[]
            selectedKey={filters.taxYear || null}
            onChange={(_, option) =>
              handleFilterChange("taxYear", option?.key as string)
            }
            allowFreeform={false}
            autoComplete="on" // ✅ enables suggestions while typing
            styles={{
              root: { minWidth: 160 },
              callout: {
                maxHeight: "30vh",
                overflowY: "auto",
                directionalHintFixed: true,
                directionalHint: 6,
              },
              optionsContainerWrapper: {
                minWidth: 160,
              },
            }}
          />

          <ComboBox
            label="Financial Year"
            placeholder="Select Financial Year"
            options={getYearOptionsFY() || []}
            selectedKey={filters.financialYear || null}
            onChange={(_, option) =>
              handleFilterChange("financialYear", option?.key as string)
            }
            allowFreeform={false}
            autoComplete="on"
            styles={{
              root: { minWidth: 160 },
              callout: {
                maxHeight: "30vh",
                overflowY: "auto",
                directionalHintFixed: true,
                directionalHint: 6,
              },
              optionsContainerWrapper: {
                minWidth: 160,
              },
            }}
          />
          {reportType == "UTP" && (
            <Dropdown
              label="Category"
              placeholder="Select Category"
              options={lovOptions["Risk Category"] || []}
              selectedKey={filters.category || null}
              onChange={(_, option) =>
                handleFilterChange("category", option?.key as string)
              }
              styles={{ root: { minWidth: 160 } }}
            />
          )}</>)}
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

          <div
            className={styles.buttonGroup}
            ref={exportRef}
            style={{ position: "relative" }}
          >
            <button
              className={styles.clearButton}
              onClick={async () => {
                const reset = {
                  dateStart: "",
                  dateEnd: "",
                  dateRangeStart: "",
                  dateRangeEnd: "",
                  category: "",
                  financialYear: "",
                  taxYear: "",
                  taxType: "",
                  taxAuthority: "",
                  entity: "",
                };
                setDateRange([null, null]);
                setSelectedDate(null);
                setFilters(reset);
                setLoading(true);
                const dataf = await normalizeData(reportType, data, "");

                setFilteredData(dataf);
                setLoading(false);
              }}
            >
              Clear Filters
            </button>
            <button
              type="button"
              className={styles.exportButton}
              onClick={() => setShowExportOptions((s) => !s)}
              aria-haspopup="menu"
              aria-expanded={showExportOptions}
            >
              Export {reportType} Report ▾
            </button>

            {/* Dropdown menu */}
            {showExportOptions && (
              <div
                className={styles.exportOptionsDropdown}
                role="menu"
                aria-label="Export options"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    exportReportPDF(reportType, filteredData);
                    setShowExportOptions(false);
                  }}
                >
                  Download as PDF
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    exportReport(reportType, filteredData);
                    setShowExportOptions(false);
                  }}
                >
                  Download as Excel
                </button>
              </div>
            )}

            <button
              className={styles.refreshButton}
              onClick={() => {
                const reset = {
                  dateStart: "",
                  dateEnd: "",
                  dateRangeStart: "",
                  dateRangeEnd: "",
                  category: "",
                  financialYear: "",
                  taxYear: "",
                  taxType: "",
                  taxAuthority: "",
                  entity: "",
                };
                setDateRange([null, null]);
                setSelectedDate(null);
                setFilters(reset);
                fetchData();
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
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={reportConfig[reportType].columns.length}
                  style={{ textAlign: "center" }}
                >
                  No Data Available
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr key={idx}>
                  {reportConfig[reportType].columns.map((col) => (
                    <td key={col.header}>{item[col.field] ?? ""}</td>
                  ))}
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
      {["Litigation", "UTP", "ActiveCases"].includes(reportType) && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
};

export default ReportsTable;
