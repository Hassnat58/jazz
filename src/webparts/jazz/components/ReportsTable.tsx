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
      { header: "No.", field: "caseNo" },
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

  const normalizeData = async (
    reportType: string,
    rawData: any[],
    cat: any
  ) => {
    switch (reportType) {
      case "Litigation":
        const sp1 = spfi().using(SPFx(SpfxContext));

        const utpIssues1 = await sp1.web.lists
          .getByTitle("UTPData")
          .items.expand("CaseNumber") // lookup field
          .select("Id,UTPId,CaseNumber/Id")();

        // Map Litigation.Id → UTP row
        const utpMap = new Map(utpIssues1.map((u) => [u.CaseNumber?.Id, u]));

        const litigationData = rawData.map((item) => {
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
        return rawData.map((item) => ({
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

        // Step 1: Get Risk Categories, EBITDA, and GrossTaxExposure from UTP Tax Issue
        const utpIssues = await sp.web.lists
          .getByTitle("UTP Tax Issue")
          .items.select(
            "Id",
            "RiskCategory",
            "EBITDA",
            "GrossTaxExposure",
            "UTP/Id"
          )
          .expand("UTP")();

        // Step 2: Group multiple risk categories + values by UTP Id
        const riskMap = utpIssues.reduce((acc, issue) => {
          const utpId = issue.UTP?.Id;
          if (!utpId) return acc;

          if (!acc[utpId]) {
            acc[utpId] = {
              riskCategories: [],
              ebitdaValues: [],
              grossTaxExposures: [],
            };
          }

          acc[utpId].riskCategories.push(issue.RiskCategory);

          // Push EBITDA if available
          if (
            issue.RiskCategory === "Probable" &&
            issue.EBITDA !== undefined &&
            issue.EBITDA !== null
          ) {
            acc[utpId].ebitdaValues.push(issue.EBITDA);
          }

          // Push GrossTaxExposure if available
          if (
            issue.RiskCategory === "Probable" &&
            issue.GrossTaxExposure !== undefined &&
            issue.GrossTaxExposure !== null
          ) {
            acc[utpId].grossTaxExposures.push(issue.GrossTaxExposure);
          }

          return acc;
        }, {} as Record<number, { riskCategories: string[]; ebitdaValues: number[]; grossTaxExposures: number[] }>);

        // Step 3: Merge RiskCategories, EBITDA & GrossTaxExposure into rawData
        const merged = rawData.map((r) => {
          const {
            riskCategories = [],
            ebitdaValues = [],
            grossTaxExposures = [],
          } = riskMap[r.Id] || {};
          const d = r.UTPDate ? new Date(r.UTPDate) : null;

          return {
            ...r,
            RiskCategories: riskCategories,
            EBITDA: ebitdaValues,
            GrossTaxExposure: grossTaxExposures,
            hasProbable: riskCategories.includes("Probable"),
            month: d ? d.getMonth() : null,
            year: d ? d.getFullYear() : null,
          };
        });

        // Step 4: Filter only those having at least one "Probable" RiskCategory
        const filtered = merged.filter((r) => r.hasProbable);

        // Step 5: Utility function for grouping
        const groupBy = (arr: any[], keyFn: (r: any) => string) =>
          arr.reduce((acc, r) => {
            const key = keyFn(r);
            if (!acc[key]) acc[key] = [];
            acc[key].push(r);
            return acc;
          }, {} as Record<string, any[]>);

        // Step 6: Get current and previous month details
        const now = new Date();
        const currentMonth = now.getMonth();
        const year = now.getFullYear();

        const prevDate = new Date(year, currentMonth - 1, 1);
        const prevMonth = prevDate.getMonth();

        // Step 7: Segregate by TaxType
        const segregated = groupBy(filtered, (r) => r.EBITDA);

        const exportData: any[] = [];

        // Step 8: Prepare export data grouped by GL Code
        Object.entries(segregated).forEach(([TaxType, rows]) => {
          const byGL = groupBy(rows as any[], (r) => r.ProvisionGLCode || "");

          let subtotalCurr = 0;
          let subtotalPrev = 0;

          Object.entries(byGL).forEach(([ProvisionGLCode, records]) => {
            (records as any[]).forEach((r: any) => {
              // Use GrossTaxExposure instead of GrossExposure
              const curr =
                r.month === currentMonth && r.year === year
                  ? r.GrossTaxExposure?.reduce(
                    (sum: number, val: number) => sum + val,
                    0
                  ) || 0
                  : 0;
              const prev =
                r.month === prevMonth && r.year === year
                  ? r.GrossTaxExposure?.reduce(
                    (sum: number, val: number) => sum + val,
                    0
                  ) || 0
                  : 0;

              subtotalCurr += curr;
              subtotalPrev += prev;

              exportData.push({
                glCode: ProvisionGLCode || "",
                taxType: r?.CaseNumber?.CorrespondenceType || "",
                provisionType: r?.EBITDA?.length ? r.EBITDA[0] : "",
                entity: r?.CaseNumber?.Entity || "",
                currentMonthAmount: formatAmount(curr),
                previousMonthAmount: formatAmount(prev),
                variance: formatAmount(
                  Number((curr + "").replace(/,/g, "")) -
                  Number((prev + "").replace(/,/g, ""))
                ),
              });
            });
          });

          // Step 9: Subtotal row
          exportData.push({
            glCode: "",
            taxType: "",
            provisionType: "",
            entity: "Sub Total",
            currentMonthAmount: formatAmount(subtotalCurr),
            previousMonthAmount: formatAmount(subtotalPrev),
            variance: formatAmount(
              Number((subtotalCurr + "").replace(/,/g, "")) -
              Number((subtotalPrev + "").replace(/,/g, ""))
            ),
          });
        });

        // Step 10: Grand total row
        const totalCurr = exportData
          .filter((r) => r.entity === "Sub Total")
          .reduce(
            (sum, r) =>
              sum +
              (Number((r.currentMonthAmount + "").replace(/,/g, "")) || 0),
            0
          );

        const totalPrev = exportData
          .filter((r) => r.entity === "Sub Total")
          .reduce(
            (sum, r) =>
              sum +
              (Number((r.previousMonthAmount + "").replace(/,/g, "")) || 0),
            0
          );

        exportData.push({
          glCode: "",
          taxType: "",
          provisionType: "",
          entity: "Grand Total",
          currentMonthAmount: formatAmount(totalCurr),
          previousMonthAmount: formatAmount(totalPrev),
          variance: formatAmount(
            Number((totalCurr + "").replace(/,/g, "")) -
            Number((totalPrev + "").replace(/,/g, ""))
          ),
        });

        return exportData;
      }

      case "Provisions3": {
        const sp3 = spfi().using(SPFx(SpfxContext));

        // ✅ Step 1: Fetch only Probable RiskCategory items from UTP Tax Issue
        const utpIssues3 = await sp3.web.lists
          .getByTitle("UTP Tax Issue")
          .items.filter("RiskCategory eq 'Probable'")
          .select(
            "Id",
            "RiskCategory",
            "GrossTaxExposure",
            "PaymentType",
            "Amount",
            "PLExposure",
            "EBITDA",
            "UTP/Id",
            "UTP/UTPDate",
            "UTP/TaxType"
          )
          .expand("UTP")();

        // ✅ Step 2: Prepare merged data with month/year
        const merged3 = utpIssues3.map((r: any) => {
          const d = r?.UTP?.UTPDate ? new Date(r.UTP.UTPDate) : null;
          return {
            ...r,
            month: d ? d.getMonth() : null,
            year: d ? d.getFullYear() : null,
          };
        });
        // console.log(merged3,'helloo');

        // ✅ Step 3: Define current/previous months
        const now3 = new Date();
        const currentMonth3 = now3.getMonth();
        const currentYear3 = now3.getFullYear();
        const prevDate3 = new Date(currentYear3, currentMonth3 - 1, 1);
        const prevMonth3 = prevDate3.getMonth();
        const prevYear3 = prevDate3.getFullYear();

        // ✅ Helper to sum amounts for a given month/year & payment type
        const sumBy = (
          arr: any[],
          month: number,
          year: number,
          condition?: (r: any) => boolean
        ) =>
          arr
            .filter(
              (r) =>
                r.month === month &&
                r.year === year &&
                (!condition || condition(r))
            )
            .reduce((s, r) => s + (Number(r.Amount) || 0), 0);

        // ✅ Step 4: Compute summaries
        const totalExposureCurr = merged3
          .filter((r) => r.month === currentMonth3 && r.year === currentYear3)
          .reduce((s, r) => s + (Number(r.GrossTaxExposure) || 0), 0);

        const totalExposurePrev = merged3
          .filter((r) => r.month === prevMonth3 && r.year === prevYear3)
          .reduce((s, r) => s + (Number(r.GrossTaxExposure) || 0), 0);

        // 💰 Payments based on PaymentType
        const paymentsUnderProtestCurr = sumBy(
          merged3,
          currentMonth3,
          currentYear3,
          (r) => r.PaymentType === "Payment under Protest"
        );
        const paymentsUnderProtestPrev = sumBy(
          merged3,
          prevMonth3,
          prevYear3,
          (r) => r.PaymentType === "Payment under Protest"
        );

        const admittedTaxCurr = sumBy(
          merged3,
          currentMonth3,
          currentYear3,
          (r) => r.PaymentType === "Admitted Tax"
        );
        const admittedTaxPrev = sumBy(
          merged3,
          prevMonth3,
          prevYear3,
          (r) => r.PaymentType === "Admitted Tax"
        );

        // 💸 Cashflow Exposure = Total Exposure - Payments
        const cashflowCurr =
          totalExposureCurr - paymentsUnderProtestCurr - admittedTaxCurr;
        const cashflowPrev =
          totalExposurePrev - paymentsUnderProtestPrev - admittedTaxPrev;

        // 📊 P&L and EBITDA Exposure
        const plCurr = merged3
          .filter((r) => r.month === currentMonth3 && r.year === currentYear3)
          .reduce(
            (s, r) =>
              s +
              (Number(
                r.RiskCategory === "Probable" ? 0 : r.GrossTaxExposure || 0
              ) || 0),
            0
          );

        const plPrev = merged3
          .filter((r) => r.month === prevMonth3 && r.year === prevYear3)
          .reduce(
            (s, r) =>
              s +
              (Number(
                r.RiskCategory === "Probable" ? 0 : r.GrossTaxExposure || 0
              ) || 0),
            0
          );

        const ebitdaCurr = merged3
          .filter((r) => r.month === currentMonth3 && r.year === currentYear3)
          .reduce(
            (s, r) =>
              s +
              (Number(
                r?.TaxType === "Income Tax"
                  ? 0
                  : r.RiskCategory === "Probable"
                    ? 0
                    : r.GrossTaxExposure || 0
              ) || 0),
            0
          );

        const ebitdaPrev = merged3
          .filter((r) => r.month === prevMonth3 && r.year === prevYear3)
          .reduce(
            (s, r) =>
              s +
              (Number(
                r?.TaxType === "Income Tax"
                  ? 0
                  : r.RiskCategory === "Probable"
                    ? 0
                    : r.GrossTaxExposure || 0
              ) || 0),
            0
          );

        // ✅ Step 5: Build Results Table
        const results3 = [
          {
            label: "Total Exposure (Probable only)",
            current: formatAmount(totalExposureCurr),
            prior: formatAmount(totalExposurePrev),
            variance: formatAmount(totalExposureCurr - totalExposurePrev),
          },
          {
            label: "Less – Payments under Protest",
            current: formatAmount(paymentsUnderProtestCurr),
            prior: formatAmount(paymentsUnderProtestPrev),
            variance: formatAmount(
              paymentsUnderProtestCurr - paymentsUnderProtestPrev
            ),
          },
          {
            label: "Less - Admitted Tax",
            current: formatAmount(admittedTaxCurr),
            prior: formatAmount(admittedTaxPrev),
            variance: formatAmount(admittedTaxCurr - admittedTaxPrev),
          },
          {
            label: "Cashflow Exposure",
            current: formatAmount(cashflowCurr),
            prior: formatAmount(cashflowPrev),
            variance: formatAmount(cashflowCurr - cashflowPrev),
          },
          {
            label: "P&L Exposure",
            current: formatAmount(plCurr),
            prior: formatAmount(plPrev),
            variance: formatAmount(plCurr - plPrev),
          },
          {
            label: "EBITDA Exposure (PKR)",
            current: formatAmount(ebitdaCurr),
            prior: formatAmount(ebitdaPrev),
            variance: formatAmount(ebitdaCurr - ebitdaPrev),
          },
        ];

        return results3;
      }

      case "Provisions2": {
        const sp = spfi().using(SPFx(SpfxContext));

        // ✅ Step 1: Get Risk Categories + GrossTaxExposure from UTP Tax Issue
        const utpIssues = await sp.web.lists
          .getByTitle("UTP Tax Issue")
          .items.select("Id", "RiskCategory", "GrossTaxExposure", "UTP/Id")
          .expand("UTP")();

        // ✅ Step 2: Group multiple risk categories by UTP Id
        const riskMap = utpIssues.reduce((acc, issue) => {
          const utpId = issue.UTP?.Id;
          if (!utpId) return acc;

          if (!acc[utpId]) {
            acc[utpId] = { riskCategories: [], grossTaxExposures: [] };
          }

          // ✅ Corrected: push to the riskCategories array
          acc[utpId].riskCategories.push(issue.RiskCategory);

          // ✅ Add only Probable GrossTaxExposure
          if (
            issue.RiskCategory === "Probable" &&
            issue.GrossTaxExposure !== undefined &&
            issue.GrossTaxExposure !== null
          ) {
            acc[utpId].grossTaxExposures.push(issue.GrossTaxExposure);
          }

          return acc;
        }, {} as Record<number, { riskCategories: string[]; grossTaxExposures: number[] }>);

        // ✅ Step 3: Merge RiskCategories into rawData
        const rawDataWithRisk = rawData.map((r) => {
          const { riskCategories = [], grossTaxExposures = [] } =
            riskMap[r.Id] || {};

          return {
            ...r,
            RiskCategories: riskCategories,
            GrossTaxExposure: grossTaxExposures,
            hasProbable: riskCategories.includes("Probable"),
          };
        });

        // ✅ Step 4: Filter only Probable risk categories for current month
        const currentMonthData: any = filterCurrentMonth(
          rawDataWithRisk
        ).filter((r: any) => r.hasProbable);

        // ✅ Step 5: Group & sum by GRS Code
        const summarized = Object.values(
          currentMonthData.reduce((acc: any, item: any) => {
            const grsCode = item.GRSCode || "";
            const exposure = (item.GrossTaxExposure || []).reduce(
              (sum: number, val: number) => sum + Number(val || 0),
              0
            );

            if (!acc[grsCode]) {
              acc[grsCode] = {
                GRSCode: grsCode,
                entity: item?.CaseNumber?.Entity || "",
                taxMatter: item?.CaseNumber?.CorrespondenceType || "",
                taxType: item?.CaseNumber?.TaxType || "",
                GrossExposure: 0,
                RiskCategories: item.RiskCategories || [],
              };
            }

            acc[grsCode].GrossExposure += exposure;
            return acc;
          }, {})
        );

        // ✅ Step 6: Subtotal
        const total: any = summarized.reduce(
          (sum: number, r: any) =>
            sum +
            (Number(String(r.GrossExposure || "0").replace(/,/g, "")) || 0),
          0
        );

        // ✅ Step 7: Format for output
        const formattedSummary = summarized.map((r: any) => ({
          ...r,
          GrossExposure: formatAmount(r.GrossExposure),
        }));

        // ✅ Step 8: Add subtotal row
        formattedSummary.push({
          GRSCode: "",
          taxMatter: "",
          entity: "Sub Total",
          taxType: "",
          GrossExposure: formatAmount(total),
        });

        return formattedSummary;
      }

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

        const grouped = groupBy2(enriched1, (r) => r.ProvisionGLCode || "");

        const exportData3: any[] = [];
        let subtotalCurr = 0;
        let subtotalPrev = 0;

        Object.entries(grouped).forEach(([ProvisionGLCode, records]) => {
          (records as any[]).forEach((r: any) => {
            const curr =
              r.month === currentMonth1 && r.year === year1
                ? r.GrossExposure || 0
                : 0;
            const prev =
              r.month === prevMonth1 && r.year === year1
                ? r.GrossExposure || 0
                : 0;

            subtotalCurr += curr;
            subtotalPrev += prev;

            exportData3.push({
              glCode: ProvisionGLCode || "",
              taxType: r?.CaseNumber?.CorrespondenceType || "", // ✅ now each row’s own correspondence type
              entity: r?.CaseNumber?.Entity || "",
              currentMonthAmount: formatAmount(curr) || 0,
              previousMonthAmount: formatAmount(prev) || 0,
              variance: formatAmount((curr || 0) - (prev || 0)),
            });
          });
        });

        // Subtotal row
        exportData3.push({
          glCode: "",
          taxType: "",
          entity: "Sub Total",
          currentMonthAmount: formatAmount(subtotalCurr),
          previousMonthAmount: formatAmount(subtotalPrev),
          variance: formatAmount(
            Number((subtotalCurr + "").replace(/,/g, "")) -
            Number((subtotalPrev + "").replace(/,/g, ""))
          ),
        });

        return exportData3;

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

        if (cat) {
          // ✅ Apply filter only when risk category is selected
          utpQuery = utpQuery.filter(`RiskCategory eq '${cat}'`);
        }

        const utpIssues = await utpQuery();

        const merged = rawData.flatMap((utp) => {
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
              (utp.GrossExposure || 0) -
              utp.Amount || 0

            ),

            ermUniqueNumbering: utp.ERMUniqueNumbering ?? "",
          };

          const relatedIssues = utpIssues.filter(
            (issue) => issue.UTPId === utp.Id
          );
          // console.log(utp.Id, utpIssues,rawData,relatedIssues,'dekhloo');

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
            provisionGlCode: utp.ProvisionGLCode, // ❌ not in data (undefined)
            provisionGrsCode: utp.GRSCode, // exists
            paymentUnderProtest:
              issue.PaymentType == "Payment under Protest"
                ? formatAmount(issue.Amount)
                : "", // exists but null (note lowercase "u")
            admittedTax:
              issue.PaymentType == "Admitted Tax"
                ? formatAmount(issue.Amount)
                : "", // exists but null (note lowercase "u")
            // exists but null (note lowercase "u")
            paymentGlCode: utp.PaymentGLCode, // ❌ not in data (undefined)
            utpPaperCategory: utp.UTPCategory, // exists but null
            provisionsContingencies: utp.ProvisionsContingencies, // ❌ not in data (undefined)

            utpIssue: issue.Title ?? "",
            amtContested: formatAmount(issue.AmountContested) ?? "",
            rate: issue.Rate ?? "",
            ermCategory: utp.ERMCategory ?? "",
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
              (issue.GrossTaxExposure || 0) -

              issue.Amount || 0
            ),

            ermUniqueNumbering: utp.ERMUniqueNumbering ?? "",
          }));

          // return [mainRow, ...issueRows];
          return [...issueRows];
        });

        return merged;
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
    let items_updated;
    let items: any[] = [];
    try {
      const listName = getListName(reportType);
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
    fetchData();
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

    const filtered = data.filter((item) => {
      let dateMatch = true;

      if (updatedFilters.dateRangeStart || updatedFilters.dateRangeEnd) {
        const start = updatedFilters.dateRangeStart
          ? normalizeDate(new Date(updatedFilters.dateRangeStart))
          : null;
        const end = updatedFilters.dateRangeEnd
          ? normalizeDate(new Date(updatedFilters.dateRangeEnd))
          : null;

        let itemDate: Date | null = null;

        if (reportType === "Litigation") {
          itemDate = item.DateReceived
            ? normalizeDate(new Date(item.DateReceived))
            : null;
        } else if (reportType === "ActiveCases") {
          itemDate = item.DateofCompliance
            ? normalizeDate(new Date(item.DateofCompliance))
            : null;
        } else {
          itemDate = item.UTPDate
            ? normalizeDate(new Date(item.UTPDate))
            : null;
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
          dateMatch &&
          (!updatedFilters.category ||
            item.RiskCategoryList?.includes(updatedFilters.category)) &&
          (!updatedFilters.financialYear ||
            item.CaseNumber?.FinancialYear === updatedFilters.financialYear) &&
          (!updatedFilters.taxYear ||
            item.CaseNumber?.TaxYear === updatedFilters.taxYear) &&
          (!updatedFilters.taxType ||
            item.CaseNumber?.TaxType === updatedFilters.taxType) &&
          (!updatedFilters.entity || item.CaseNumber?.Entity === updatedFilters.entity)
        );
      }

      if (["Litigation", "ActiveCases"].includes(reportType)) {
        return (
          dateMatch &&
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

      return dateMatch;
    });

    setLoading(true);
    const dataf = await normalizeData(
      reportType,
      filtered,
      updatedFilters.category
    );
    setFilteredData(dataf);
    setLoading(false);
  };

  const handleFilterChangeDate = async (value1: string, value2: string) => {
    const updatedFilters = { ...filters, dateStart: value1, dateEnd: value2 };
    setFilters(updatedFilters);

    const filtered = data.filter((item) => {
      let dateMatch = true;

      if (value1 || value2) {
        // convert to YYYY-MM-DD for comparison
        // const startStr = updatedFilters.dateStart || null;
        const endStr = updatedFilters.dateEnd || null;

        const itemDateRaw =
          reportType === "Litigation"
            ? item.DateReceived
            : reportType === "ActiveCases"
              ? item.DateofCompliance
              : item.UTPDate;

        const itemDateStr = itemDateRaw
          ? new Date(itemDateRaw).toISOString().split("T")[0]
          : null;

        if (itemDateStr) {
          dateMatch = true;

          // if (startStr && itemDateStr < startStr) {
          //   dateMatch = false;
          // }
          if (endStr && itemDateStr > endStr) {
            dateMatch = false;
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
              item.RiskCategoryList?.includes(updatedFilters.category)) &&
            (!updatedFilters.financialYear ||
              item.CaseNumber?.FinancialYear === updatedFilters.financialYear) &&
            (!updatedFilters.taxYear ||
              item.CaseNumber?.TaxYear === updatedFilters.taxYear) &&
            (!updatedFilters.taxType ||
              item.CaseNumber?.TaxType === updatedFilters.taxType) &&
            (!updatedFilters.entity || item.CaseNumber?.Entity === updatedFilters.entity)
          );

        case "Litigation":
        case "ActiveCases":
          return (
            dateMatch &&
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
          return dateMatch;
      }
    });

    setLoading(true);
    const dataf = await normalizeData(
      reportType,
      filtered,
      updatedFilters.category
    );
    setFilteredData(dataf);
    setLoading(false);
  };
  const handleFilterChangeDate2 = async (
    value1: string,
    value2: string,
    data2: any
  ) => {
    const updatedFilters = { ...filters, dateStart: value1, dateEnd: value2 };
    // console.log(value1, value2, data2, "data2");

    setFilters(updatedFilters);

    const filtered = data2.filter((item: any) => {
      let dateMatch = true;

      if (value1 || value2) {
        const startDate = value1 ? new Date(value1) : null;
        const endDate = value2 ? new Date(value2) : null;

        const itemDateRaw = item.DateofCompliance;
        const itemDate = itemDateRaw ? new Date(itemDateRaw) : null;

        if (itemDate) {
          dateMatch = true;

          if (startDate && itemDate < startDate) {
            dateMatch = false;
          }
          if (endDate && itemDate > endDate) {
            dateMatch = false;
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
              item.RiskCategoryList?.includes(updatedFilters.category)) &&
            (!updatedFilters.financialYear ||
              item.CaseNumber?.FinancialYear === updatedFilters.financialYear) &&
            (!updatedFilters.taxYear ||
              item.CaseNumber?.TaxYear === updatedFilters.taxYear) &&
            (!updatedFilters.taxType ||
              item.CaseNumber?.TaxType === updatedFilters.taxType) &&
            (!updatedFilters.entity || item.CaseNumber?.Entity === updatedFilters.entity)
          );

        case "Litigation":
        case "ActiveCases":
          return (
            dateMatch &&
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
          return dateMatch;
      }
    });

    setLoading(true);
    const dataf = await normalizeData(
      reportType,
      filtered,
      updatedFilters.category
    );
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
       {reportType == "Provisions3"&&<div className={styles.filtersRow}>
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
        )}
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
      </div>}

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
