/* eslint-disable max-lines */
/* eslint-disable no-debugger */
/* eslint-disable dot-notation */
/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useEffect, useState } from "react";
import { spfi, SPFx } from "@pnp/sp";
import { Offcanvas, Button } from "react-bootstrap";
import styles from "./TabedTables.module.scss";
import CaseForm from "./CaseForm";
import ViewCaseForm from "./ViewCaseForm";
import "bootstrap/dist/css/bootstrap.min.css";
import CorrespondenceOutForm from "./CorrespondenceOutForm";
import ViewCorrespondenceOutForm from "./ViewCorrespondenceOut";
import UTPForm from "./UTPForm";
// import ManagersTable from "./ManagersTable";
import ViewUTPForm from "./ViewUTPForm";
import DocumentGrid from "./DocumentGrid";
import ReportsTable from "./ReportsTable";
import LOVManagement from "./LOVManagement";
import Notifications from "./Notifications";
// import LOVForm from "./LOVForm";
import Pagination from "./Pagination";
import { Dropdown, IDropdownOption } from "@fluentui/react";
import { ComboBox } from "@fluentui/react";
import PowerBIDashboard from "./PowerBIDashboard";
import ManageRole from "./ManageRole";
import RoleForm from "./RoleForm";
import Consultant from "./Consultant";
import Lawyer from "./Lawyer";
import logo from "../assets/jazz-logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faUser } from "@fortawesome/free-solid-svg-icons";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const tabs = [
  "Dashboard",
  "Email Notification",
  "Litigation",
  "Response",
  "UTP Dashboard",
  "Documents",
  "Reports",
  // "Managers",
];

type ReportType =
  | "UTP"
  | "Litigation"
  | "ActiveCases"
  | "Provisions1"
  | "Provisions2"
  | "Contingencies"
  | "ERM";

const TabbedTables: React.FC<{
  showLOVManagement: boolean;
  setShowLOVManagement: React.Dispatch<React.SetStateAction<boolean>>;
  SpfxContext: any;
  showManageRole: any;
  setShowManageRole: React.Dispatch<React.SetStateAction<boolean>>;
  showConsultantManagement: boolean;
  setShowConsultantManagement: React.Dispatch<React.SetStateAction<boolean>>;
  showLawyerManagement: boolean;
  setShowLawyerManagement: React.Dispatch<React.SetStateAction<boolean>>;
  onLOVManagementClick: () => void;
  onManageRoleClick: () => void;
  onConsultantManagementClick: () => void;
  onLawyerManagementClick: () => void;
}> = ({
  SpfxContext,
  showLOVManagement,
  setShowLOVManagement,
  showManageRole,
  setShowManageRole,
  showConsultantManagement,
  setShowConsultantManagement,
  showLawyerManagement,
  setShowLawyerManagement,
  onLOVManagementClick,
  onManageRoleClick,
  onConsultantManagementClick,
  onLawyerManagementClick,
}) => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [casesData, setCasesData] = useState<any[]>([]);
  const [caseOptions, setCaseOptions] = useState<
    { key: number; text: string }[]
  >([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [notiID, setNotiID] = useState<any>(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [existing, setExisting] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [correspondenceOutData, setCorrespondenceOutData] = useState<any[]>([]);
  const [utpData, setUtpData] = useState<any[]>([]);
  const [reportType, setReportType] = useState<ReportType>("UTP");
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [userPhoto, setUserPhoto] = React.useState<string | null>(null);
  const [filters, setFilters] = useState({
    Entity: "",
    category: "",
    financialYear: "",
    taxYear: "",
    taxType: "",
    taxAuthority: "",
    caseNumber: "",
  });
  const [correspondenceFilters, setCorrespondenceFilters] = useState({
    caseNumber: "",
    taxType: "",
    taxAuthority: "",
  });
  const [lovOptions, setLovOptions] = useState<{
    [key: string]: IDropdownOption[];
  }>({});
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredCorrespondenceOutData, setFilteredCorrespondenceOutData] =
    useState<any[]>([]);
  const [utpFilters, setUtpFilters] = useState({
    entity: "",
    category: "",
    financialYear: "",
    taxYear: "",
    taxType: "",
    taxAuthority: "",
    caseNumber: "",
  });
  const [filteredUtpData, setFilteredUtpData] = useState<any[]>([]);
  const [activeFormType, setActiveFormType] = useState<
    "case" | "correspondenceOut" | "UTP" | "Role" | null
  >(null);
  // const [showLOVManagement, setShowLOVManagement] = useState(false);
  const [casesPage, setCasesPage] = useState(1);
  const [correspondencePage, setCorrespondencePage] = useState(1);
  const [utpPage, setUtpPage] = useState(1);
  const [userRole, setUserRole] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const itemsPerPage = 10;

  const sp = spfi().using(SPFx(SpfxContext));

  React.useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const sp = spfi().using(SPFx(SpfxContext));

        // Get current user
        const currentUser = await sp.web.currentUser();

        // ✅ Get user photo URL
        const photoUrl = `${SpfxContext.pageContext.web.absoluteUrl}/_layouts/15/userphoto.aspx?accountname=${currentUser.Email}&size=M`;
        setUserPhoto(photoUrl);
        const roles = await sp.web.lists
          .getByTitle("Role")
          .items.filter(`Person/Id eq ${currentUser.Id}`)
          .select("Role", "Person/Id")
          .expand("Person")();

        const hasAdminRole = roles.some((r: any) => r.Role === "Admin");
        setIsAdmin(hasAdminRole);
      } catch (err) {
        console.error("Error loading user info:", err);
      }
    };

    loadUserInfo();
  }, [SpfxContext]);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    if (activeTab === "Litigation") {
      loadCasesData();
    } else if (activeTab === "Response") {
      loadCorrespondenceOutData();
    } else if (activeTab === "UTP Dashboard") {
      loadUTPData();
    }
  }, [activeTab]);
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const cases = await sp.web.lists
          .getByTitle("Cases")
          .items.select(
            "Id",
            "Title",
            "TaxType",
            "TaxAuthority",
            "ApprovalStatus"
          )
          .filter("ApprovalStatus eq 'Approved'")
          .top(5000)();

        // Format and remove duplicate titles
        const uniqueTitles = new Map<string, { key: number; text: string }>();

        cases.forEach((c: any) => {
          const title = c.Title?.trim();
          if (title && !uniqueTitles.has(title)) {
            uniqueTitles.set(title, { key: c.Id, text: title });
          }
        });

        setCaseOptions(Array.from(uniqueTitles.values()));
      } catch (error) {
        console.error("Error fetching cases:", error);
      }
    };

    fetchCases();
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Get current user
        const user = await sp.web.currentUser();
        setCurrentUser(user); // store full object

        // Get role entry for this user
        const items = await sp.web.lists
          .getByTitle("Role")
          .items.filter(`Person/Id eq ${user.Id}`)
          .select("Id", "Role", "Person/Id")
          .expand("Person")();

        if (items.length > 0) {
          const roles = items.map((i) => i.Role?.toLowerCase());
          setUserRole(roles);
        } else {
          console.log("No roles found for user");
        }
      } catch (error) {
        console.error("Error fetching role:", error);
      }
    };

    fetchUserRole();
  }, []);
  const hideReports =
    userRole.includes("Manager") && !userRole.includes("Admin");
  const visibleTabs = hideReports ? tabs.filter((t) => t !== "Reports") : tabs;

  // helper functions for filters
  const getFinancialYearOptions = (): IDropdownOption[] => {
    const currentYear = new Date().getFullYear();
    const years: IDropdownOption[] = [];
    for (let y = currentYear; y >= 1980; y--) {
      years.push({ key: "FY" + y.toString(), text: "FY" + y.toString() });
    }
    return years;
  };

  const getTaxYearOptions = (): IDropdownOption[] => {
    const currentYear = new Date().getFullYear();
    const years: IDropdownOption[] = [];
    for (let i = currentYear; i >= 1980; i--) {
      years.push({
        key: i.toString(),
        text: i.toString(),
      });
    }
    return years;
  };

  const loadCorrespondenceOutData = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle("CorrespondenceOut")
        .items.select(
          "ID",
          "Title",
          "Dateoffiling",
          "FiledAt",
          "Status",
          "CorrespondenceOut",
          "Filedthrough",
          "BriefDescription",
          "CaseNumber/Id",
          "CaseNumber/Title",
          "Author/Title",
          "Editor/Title",
          "CaseNumberId",
          "CaseNumber/TaxType",
          "CaseNumber/TaxAuthority",
          "CaseNumber/Entity",
          "CaseNumber/TaxYear",
          "Created",
          "Modified"
        )
        .top(50000)
        .expand("CaseNumber", "Author", "Editor")
        .orderBy("ID", false)();
      setCorrespondenceOutData(items);
      setFilteredCorrespondenceOutData(items);
    } catch (err) {
      console.error("Error fetching data from Correspondence Out list:", err);
    }
  };

  const loadCasesData = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle("Cases")
        .items.select(
          "ID",
          "Title",
          "CorrespondenceType",
          "Dateofdocument",
          "Entity",
          "FinancialYear",
          "TaxYear",
          "TaxType",
          "TaxAuthority",
          "Hearingdate",
          "GrossExposure",
          "GrossTaxDemanded",
          "CaseStatus",
          "Author/Title",
          "Editor/Title",
          "ParentCase/Id",
          "ParentCase/Title",
          "ParentCase/TaxType",
          "ParentCase/TaxAuthority",
          "DateReceived",
          "StayExpiringOn",
          "DateofCompliance",
          "OrderSummary",
          "Email",
          "Exposure_x0020_Issues",
          "PendingAuthority",
          "CorrespondenceType",
          "IssuedBy",
          "DocumentReferenceNumber",
          "BriefDescription",
          "TaxConsultantAssigned",
          "ParentCaseId",
          "ConsultantEmail",
          "LawyerAssigned0",
          "LawyerEmail",
          "ApprovalStatus",
          "TaxExposure",
          "ApprovedBy",
          "ApprovedDate",
          "Created",
          "Modified"
        )
        .top(50000)
        .expand("Author", "Editor", "ParentCase")
        .orderBy("ID", false)();
      setCasesData(items);
      setFilteredData(items);
    } catch (err) {
      console.error("Error fetching data from Cases list:", err);
    }
  };

  const loadUTPData = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle("UTPData")
        .items.select(
          "ID",
          "Title",
          "GMLRID",
          "GRSCode",
          "ERMUniqueNumbering",
          "GrossExposure",
          "PLExposure",
          "EBITDAExposureExists",
          "CashFlowExposure",
          "PaymentType/Title",
          "Status",
          "Author/Title",
          "Editor/Title",
          "UTPId",
          "TaxType",
          "CaseNumberId",
          "CaseNumber/Id",
          "CaseNumber/Title",
          "CaseNumber/TaxType",
          "CaseNumber/TaxAuthority",
          "CaseNumber/Entity",
          "CaseNumber/PendingAuthority",
          "CaseNumber/TaxYear",
          "ERMCategory",
          "UTPCategory",
          "UTPDate",
          "Modified",
          "Amount",
          "PaymentGLCode",
          "ProvisionGLCode",
          "ApprovedBy",
          "ApprovedDate",
          "Created"
        )
        .top(50000)
        .orderBy("ID", false)
        .expand("Author", "Editor", "CaseNumber")();
      setUtpData(items);
      setFilteredUtpData(items);
    } catch (err) {
      console.error("Error fetching data from UTP list:", err);
    }
  };
  const fetchAttachments = async (
    itemId: number,
    type: "case" | "correspondenceOut" | "UTP"
  ) => {
    try {
      let filter = "";

      if (type === "case") {
        filter = `CaseId eq ${itemId}`;
      } else if (type === "correspondenceOut") {
        filter = `CorrespondenceOutId eq ${itemId}`;
      } else if (type === "UTP") {
        filter = `UTPId eq ${itemId}`;
      }

      const files = await sp.web.lists
        .getByTitle("Core Data Repositories")
        .items.filter(filter)
        .select("File/Name", "File/ServerRelativeUrl", "ID")
        .expand("File")();
      setAttachments(files);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const handleCancel = () => {
    setExisting(false);
    setIsAddingNew(false);
    setSelectedCase(null);
    setShowConsultantManagement(false);
    setShowLOVManagement(false);
    setShowManageRole(false);
    setShowLawyerManagement(false);
  };

  const handleSave = (formData: any) => {
    setExisting(false);
    setIsAddingNew(false);
    setSelectedCase(null);
    if (activeFormType === "case") loadCasesData();
    else if (activeFormType === "correspondenceOut")
      loadCorrespondenceOutData();
    if (activeFormType === "UTP") loadUTPData();
    // if (activeFormType === "LOV") {
    //   setShowLOVManagement(true);
    // }
    // if (activeFormType === "Role") {
    //   setShowManageRole(true);
    // }
    // if (activeFormType === "Consultant") {
    //   setShowConsultantManagement(true);
    // }
    // if (activeFormType === "Lawyer") {
    //   setShowLawyerManagement(true);
    // }
  };

  const handleShow = async (item: any) => {
    setSelectedCase(item);

    let type: "case" | "correspondenceOut" | "UTP";
    if (activeTab === "Litigation") {
      type = "case";
    } else if (activeTab === "Response") {
      type = "correspondenceOut";
    } else if (activeTab === "UTP Dashboard") {
      type = "UTP";
    } else {
      type = "case"; // default fallback
    }
    await fetchAttachments(item.ID, type);

    setShowOffcanvas(true);
  };

  const handleClose = () => {
    setShowOffcanvas(false);
    setSelectedCase(null);
  };
  // const handleFilterChange = (key: string, value: string) => {
  //   const updatedFilters = { ...filters, [key]: value };
  //   setFilters(updatedFilters);

  //   const filtered = paginatedData.filter((item) => {
  //     // const itemDate = new Date(item.dateReceived);

  //     //   const startCheck = updatedFilters.dateStart
  //     //     ? itemDate >= new Date(updatedFilters.dateStart)
  //     //     : true;

  //     //   const endCheck = updatedFilters.dateEnd
  //     //     ? itemDate <= new Date(updatedFilters.dateEnd)
  //     //     : true;

  //     return (
  //       // startCheck &&
  //       // endCheck &&
  //       (!updatedFilters.category ||
  //         item.category === updatedFilters.category) &&
  //       (!updatedFilters.financialYear ||
  //         item.fy === updatedFilters.financialYear) &&
  //       (!updatedFilters.taxYear || item.taxYear === updatedFilters.taxYear) &&
  //       (!updatedFilters.taxType || item.taxType === updatedFilters.taxType) &&
  //       (!updatedFilters.taxAuthority ||
  //         item.taxAuthority === updatedFilters.taxAuthority) &&
  //       (!updatedFilters.entity || item.entity === updatedFilters.entity)
  //     );
  //   });

  //   setFilteredData(filtered);
  // };
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

  // React.useEffect(() => {
  //   if (showLOVManagement) {
  //     setShowManageRole(false);
  //   }
  // }, [showLOVManagement]);

  // React.useEffect(() => {
  //   if (showManageRole) {
  //     setShowLOVManagement(false);
  //   }
  // }, [showManageRole]);

  // React.useEffect(() => {
  //   if (showConsultantManagement) {
  //     setShowConsultantManagement(false);
  //   }
  // }, [showConsultantManagement]);

  // React.useEffect(() => {
  //   if (showLawyerManagement) {
  //     setShowLawyerManagement(false);
  //   }
  // }, [showLawyerManagement]);

  useEffect(() => {
    setIsAddingNew(false);
    setSelectedCase(null);
    setExisting(false);
    setAttachments([]);
    setActiveFormType(null);
    setShowOffcanvas(false);

    setFilters({
      Entity: "",
      category: "",
      financialYear: "",
      taxYear: "",
      taxType: "",
      taxAuthority: "",
      caseNumber: "",
    });
    setCorrespondenceFilters({
      caseNumber: "",
      taxType: "",
      taxAuthority: "",
    });
    setUtpFilters({
      entity: "",
      category: "",
      financialYear: "",
      taxYear: "",
      taxType: "",
      taxAuthority: "",
      caseNumber: "",
    });
  }, [activeTab]);

  const renderCorrespondenceTable = () => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
      (casesPage - 1) * itemsPerPage,
      casesPage * itemsPerPage
    );
    const handleFilterChange = (key: string, value: string | undefined) => {
      const updatedFilters = { ...filters, [key]: value ?? "" };
      setFilters(updatedFilters);

      const filtered = casesData.filter((item) => {
        const caseNum = item.ParentCase
          ? getFormattedCaseNumber(
              item.TaxType,
              item.TaxAuthority,
              item.ParentCase.Id
            )
          : item.Title;

        return (
          (!updatedFilters.caseNumber ||
            caseNum
              .toLowerCase()
              .includes(updatedFilters.caseNumber.toLowerCase())) &&
          (!updatedFilters.financialYear ||
            item.FinancialYear === updatedFilters.financialYear) &&
          (!updatedFilters.taxYear ||
            item.TaxYear === updatedFilters.taxYear) &&
          (!updatedFilters.taxType ||
            item.TaxType === updatedFilters.taxType) &&
          (!updatedFilters.taxAuthority ||
            item.TaxAuthority === updatedFilters.taxAuthority) &&
          (!updatedFilters.Entity || item.Entity === updatedFilters.Entity)
        );
      });

      setFilteredData(filtered);
      setCasesPage(1);
    };
    const getFormattedCaseNumber = (
      taxType: string,
      taxAuthority: string,
      parentCaseId: number
    ) => {
      let prefix = "CN";
      if (taxType === "Income Tax") prefix = "IT";
      else if (taxType === "Sales Tax") prefix = "ST";
      const authority = taxAuthority ? `-${taxAuthority}` : "";

      return `${prefix}${authority}-${parentCaseId}`;
    };

    return (
      <>
        <div className={styles.filtersRow}>
          {/* Case Number Filter */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <ComboBox
              label="Case Number"
              key={filters.caseNumber}
              placeholder="Select or type Case Number"
              allowFreeform
              autoComplete="on"
              useComboBoxAsMenuWidth
              options={caseOptions}
              selectedKey={
                caseOptions.find(
                  (opt) =>
                    opt.text.toLowerCase() ===
                    (filters.caseNumber || "").toLowerCase()
                )?.key
              }
              text={filters.caseNumber || ""}
              onInputValueChange={(newText) => {
                handleFilterChange("caseNumber", newText);
              }}
              onChange={(_, option, __, value) => {
                const newValue = option ? (option.text as string) : value || "";
                handleFilterChange("caseNumber", newValue);
              }}
              styles={{
                root: { width: "200px" },
                container: { width: "200px" },
                callout: {
                  width: "100%",
                  maxHeight: 5 * 36,
                  overflowY: "auto",
                },
                optionsContainerWrapper: {
                  maxHeight: 5 * 36,
                  overflowY: "auto",
                },
                input: { width: "100%" },
              }}
            />

            {filters.caseNumber && (
              <button
                type="button"
                onClick={() => handleFilterChange("caseNumber", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Entity */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <Dropdown
              label="Entity"
              placeholder="Select Entity"
              options={lovOptions.Entity || []}
              selectedKey={filters.Entity || null}
              onChange={(_, option) =>
                handleFilterChange("Entity", option?.key as string)
              }
              styles={{ root: { minWidth: 160 } }}
            />
            {filters.Entity && (
              <button
                type="button"
                onClick={() => handleFilterChange("Entity", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Tax Type */}
          <div style={{ position: "relative", display: "inline-block" }}>
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
            {filters.taxType && (
              <button
                type="button"
                onClick={() => handleFilterChange("taxType", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Tax Authority */}
          <div style={{ position: "relative", display: "inline-block" }}>
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
            {filters.taxAuthority && (
              <button
                type="button"
                onClick={() => handleFilterChange("taxAuthority", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Tax Year */}
          <div
            style={{
              position: "relative",
              display: "inline-block",
            }}
          >
            {filters.taxType === "Sales Tax" ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontWeight: "600" }}>Tax Year</label>
                <ReactDatePicker
                  selected={
                    filters.taxYear
                      ? (() => {
                          try {
                            if (/^\d{2}\/\d{4}$/.test(filters.taxYear)) {
                              const [month, year] = filters.taxYear.split("/");
                              return new Date(
                                Number(year),
                                Number(month) - 1,
                                1
                              );
                            } else if (!isNaN(Date.parse(filters.taxYear))) {
                              return new Date(filters.taxYear);
                            }
                            return null;
                          } catch {
                            return null;
                          }
                        })()
                      : null
                  }
                  onChange={(date: Date | null) => {
                    if (date) {
                      const formatted = `${String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      )}/${date.getFullYear()}`;
                      handleFilterChange("taxYear", formatted);
                    } else {
                      handleFilterChange("taxYear", "");
                    }
                  }}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  placeholderText="Select month and year"
                  className={styles.datePickerInput}
                />
              </div>
            ) : (
              <Dropdown
                label="Tax Year"
                placeholder="Select Tax Year"
                options={getTaxYearOptions()}
                selectedKey={filters.taxYear || null}
                onChange={(_, option) =>
                  handleFilterChange("taxYear", option?.key as string)
                }
                styles={{
                  root: { width: "160px" },
                  dropdown: { width: "100%" },
                  callout: {
                    width: "100%",
                    maxHeight: 5 * 36,
                    overflowY: "auto",
                  },
                  title: { width: "160px" },
                }}
              />
            )}
            {filters.taxYear && (
              <button
                type="button"
                onClick={() => handleFilterChange("taxYear", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Financial Year */}
          <div style={{ position: "relative", display: "inline-block" }}>
            {filters.taxType === "Sales Tax" ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontWeight: "600", marginBottom: "0px" }}>
                  Financial Year
                </label>
                <ReactDatePicker
                  selected={
                    filters.financialYear
                      ? (() => {
                          try {
                            if (/^\d{2}\/\d{4}$/.test(filters.financialYear)) {
                              const [month, year] =
                                filters.financialYear.split("/");
                              return new Date(
                                Number(year),
                                Number(month) - 1,
                                1
                              );
                            } else if (
                              !isNaN(Date.parse(filters.financialYear))
                            ) {
                              return new Date(filters.financialYear);
                            }
                            return null;
                          } catch {
                            return null;
                          }
                        })()
                      : null
                  }
                  onChange={(date: Date | null) => {
                    if (date) {
                      const formatted = `${String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      )}/${date.getFullYear()}`;
                      handleFilterChange("financialYear", formatted);
                    } else {
                      handleFilterChange("financialYear", "");
                    }
                  }}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  placeholderText="Select month and year"
                  className={styles.datePickerInput}
                />
              </div>
            ) : (
              <Dropdown
                label="Financial Year"
                placeholder="Select Financial Year"
                options={getFinancialYearOptions()}
                selectedKey={filters.financialYear || null}
                onChange={(_, option) =>
                  handleFilterChange("financialYear", option?.key as string)
                }
                styles={{
                  root: { width: "160px" },
                  dropdown: { width: "100%" },
                  callout: {
                    width: "100%",
                    maxHeight: 5 * 36,
                    overflowY: "auto",
                  },
                  title: { width: "160px" },
                }}
              />
            )}
            {filters.financialYear && (
              <button
                type="button"
                onClick={() => handleFilterChange("financialYear", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          <button
            type="button"
            className={styles.clearFiltersButton}
            onClick={() => {
              setFilters({
                Entity: "",
                category: "",
                financialYear: "",
                taxYear: "",
                taxType: "",
                taxAuthority: "",
                caseNumber: "",
              });
              setFilteredData(casesData);
              setCasesPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Case No</th>
              <th>Correspondence Type</th>
              <th>Date Received</th>
              <th>Financial Year</th>
              <th>Date of Compliance</th>
              <th>Lawyer Assigned</th>
              <th>Approval Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.ID}>
                <td>
                  {item.ParentCase
                    ? getFormattedCaseNumber(
                        item.TaxType,
                        item.TaxAuthority,
                        item.ParentCase.Id
                      )
                    : item.Title}
                </td>
                <td>{item.CorrespondenceType}</td>
                <td>{item.DateReceived?.split("T")[0]}</td>
                <td>{item.FinancialYear}</td>
                <td>{item.DateofCompliance?.split("T")[0]}</td>
                <td>{item.LawyerAssigned0}</td>
                <td>
                  {item.ApprovalStatus && (
                    <div
                      style={{
                        backgroundColor:
                          item.ApprovalStatus === "Approved"
                            ? "#5ebd74"
                            : "#20a5bb",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {item.ApprovalStatus}
                    </div>
                  )}
                </td>
                <td>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    title="View"
                    onClick={() => handleShow(item)}
                  >
                    👁
                  </Button>
                  <Button
                    variant="link"
                    className={styles.editBtn}
                    title="Edit"
                    onClick={() => {
                      setSelectedCase(item);
                      setActiveFormType("case");
                      setIsAddingNew(true);
                      setExisting(true);
                    }}
                    disabled={
                      item.CaseStatus === "Draft" &&
                      item.Author?.Id !== currentUser?.Id
                    }
                  >
                    ✏️
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination for Cases */}
        <Pagination
          currentPage={casesPage}
          totalPages={totalPages}
          totalItems={casesData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCasesPage}
        />
      </>
    );
  };

  const renderCorrespondenceOutTable = () => {
    const totalPages = Math.ceil(correspondenceOutData.length / itemsPerPage);
    const paginatedData = filteredCorrespondenceOutData.slice(
      (correspondencePage - 1) * itemsPerPage,
      correspondencePage * itemsPerPage
    );

    const getFormattedCaseNumber = (caseNumber: any) => {
      if (!caseNumber) return "";

      let prefix = "CN";
      if (caseNumber.TaxType === "Income Tax") prefix = "IT";
      if (caseNumber.TaxType === "Sales Tax") prefix = "ST";

      // handle Tax Authority
      const taxAuth = caseNumber?.TaxAuthority || "";

      // handle Id from lookup
      const id = caseNumber?.Id || caseNumber?.ID || "";

      return `${prefix}${taxAuth ? "-" + taxAuth : ""}${id ? "-" + id : ""}`;
    };

    const handleCorrespondenceFilterChange = (
      key: string,
      value: string | undefined
    ) => {
      const updatedFilters = { ...correspondenceFilters, [key]: value };
      setCorrespondenceFilters(updatedFilters);

      const filtered = correspondenceOutData.filter((item) => {
        const matchesCase =
          !updatedFilters.caseNumber ||
          getFormattedCaseNumber(item.CaseNumber)
            .toLowerCase()
            .includes(updatedFilters.caseNumber.toLowerCase());

        const matchesTaxType =
          !updatedFilters.taxType ||
          item.CaseNumber?.TaxType === updatedFilters.taxType;

        const matchesTaxAuthority =
          !updatedFilters.taxAuthority ||
          item.CaseNumber?.TaxAuthority === updatedFilters.taxAuthority;

        return matchesCase && matchesTaxType && matchesTaxAuthority;
      });

      setFilteredCorrespondenceOutData(filtered);
      setCorrespondencePage(1);
    };

    return (
      <>
        <div className={styles.filtersRow}>
          {/* Case Number */}
          <ComboBox
            label="Case Number"
            placeholder="Select or type Case Number"
            allowFreeform
            autoComplete="on"
            useComboBoxAsMenuWidth
            options={caseOptions}
            text={correspondenceFilters.caseNumber || ""}
            onInputValueChange={(newText) => {
              handleCorrespondenceFilterChange("caseNumber", newText);
            }}
            onChange={(_, option, __, value) => {
              const newValue = option ? (option.text as string) : value || "";
              handleCorrespondenceFilterChange("caseNumber", newValue);
            }}
            styles={{
              root: { width: "200px" },
              container: { width: "200px" },
              callout: {
                width: "100%",
                maxHeight: 5 * 36,
                overflowY: "auto",
              },
              optionsContainerWrapper: {
                maxHeight: 5 * 36,
                overflowY: "auto",
              },
              input: { width: "100%" },
            }}
          />

          <div style={{ position: "relative", display: "inline-block" }}>
            <ComboBox
              label="Tax Type"
              placeholder="Select Tax Type"
              options={lovOptions["Tax Type"] || []}
              selectedKey={correspondenceFilters.taxType || ""}
              onChange={(_, option) =>
                handleCorrespondenceFilterChange(
                  "taxType",
                  option?.key as string
                )
              }
              styles={{ root: { minWidth: 200 } }}
            />
            {correspondenceFilters.taxType && (
              <button
                type="button"
                onClick={() =>
                  handleCorrespondenceFilterChange("taxType", undefined)
                }
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Tax Authority (Dropdown with clear button) */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <Dropdown
              label="Tax Authority"
              placeholder="Select Tax Authority"
              options={lovOptions["Tax Authority"] || []}
              selectedKey={correspondenceFilters.taxAuthority || null}
              onChange={(_, option) =>
                handleCorrespondenceFilterChange(
                  "taxAuthority",
                  option?.key as string
                )
              }
              styles={{ root: { minWidth: 160 } }}
            />
            {correspondenceFilters.taxAuthority && (
              <button
                type="button"
                onClick={() =>
                  handleCorrespondenceFilterChange("taxAuthority", undefined)
                }
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          <button
            type="button"
            className={styles.clearFiltersButton}
            onClick={() => {
              setCorrespondenceFilters({
                caseNumber: "",
                taxType: "",
                taxAuthority: "",
              });
              setFilteredCorrespondenceOutData(correspondenceOutData);
              setCorrespondencePage(1);
            }}
          >
            Clear Filters
          </button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Correspondence Out</th>
              <th>Brief Description</th>
              <th>Field Through</th>
              <th>Field At</th>
              <th>Date Of Filling</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.ID}>
                <td>
                  {(() => {
                    if (!item.CaseNumber) return "";
                    let prefix = "CN";
                    if (item.CaseNumber.TaxType === "Income Tax") prefix = "IT";
                    if (item.CaseNumber.TaxType === "Sales Tax") prefix = "ST";
                    const taxAuth = item.CaseNumber.TaxAuthority || "N/A";
                    return `${prefix}-${taxAuth}-${item.CaseNumber?.Id}`;
                  })()}
                </td>

                <td>{item.CorrespondenceOut}</td>
                <td>{item.BriefDescription}</td>
                <td>{item.Filedthrough}</td>
                <td>{item.FiledAt}</td>
                <td>{item.Dateoffiling?.split("T")[0]}</td>
                <td>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    title="View"
                    onClick={() => handleShow(item)}
                  >
                    👁
                  </Button>
                  <Button
                    variant="link"
                    className={styles.editBtn}
                    title="Edit"
                    onClick={() => {
                      setSelectedCase(item);
                      setActiveFormType("correspondenceOut");
                      setIsAddingNew(true);
                    }}
                    disabled={
                      item.CaseStatus === "Draft" &&
                      item.Author?.Id !== currentUser?.Id
                    }
                  >
                    ✏️
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          currentPage={correspondencePage}
          totalPages={totalPages}
          totalItems={correspondenceOutData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCorrespondencePage}
        />
      </>
    );
  };
  const renderUTPTable = () => {
    const totalPages = Math.ceil(utpData.length / itemsPerPage);
    const paginatedData = filteredUtpData.slice(
      (utpPage - 1) * itemsPerPage,
      utpPage * itemsPerPage
    );

    const handleUtpFilterChange = (key: string, value: string | undefined) => {
      const updatedFilters = { ...utpFilters, [key]: value };
      setUtpFilters(updatedFilters);

      const filtered = utpData.filter((item) => {
        const caseNum = item.CaseNumber?.Title
          ? item.CaseNumber.Title
          : item.Title || "";

        return (
          (!updatedFilters.caseNumber ||
            caseNum
              .toLowerCase()
              .includes(updatedFilters.caseNumber.toLowerCase())) &&
          (!updatedFilters.category ||
            item.Category === updatedFilters.category) &&
          (!updatedFilters.financialYear ||
            item.FinancialYear === updatedFilters.financialYear) &&
          (!updatedFilters.taxYear ||
            item.TaxYear === updatedFilters.taxYear) &&
          (!updatedFilters.taxType ||
            item.TaxType === updatedFilters.taxType) &&
          (!updatedFilters.taxAuthority ||
            item.TaxAuthority === updatedFilters.taxAuthority) &&
          (!updatedFilters.entity || item.Entity === updatedFilters.entity)
        );
      });

      setFilteredUtpData(filtered);
      setUtpPage(1);
    };
    return (
      <>
        <div className={styles.filtersRow}>
          {/* Case Number Filter */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <ComboBox
              label="Case Number"
              key={utpFilters.caseNumber}
              placeholder="Select or type Case Number"
              allowFreeform
              autoComplete="on"
              useComboBoxAsMenuWidth
              options={caseOptions}
              text={utpFilters.caseNumber || ""}
              onInputValueChange={(newText) => {
                handleUtpFilterChange("caseNumber", newText);
              }}
              onChange={(_, option, __, value) => {
                const newValue = option ? (option.text as string) : value || "";
                handleUtpFilterChange("caseNumber", newValue);
              }}
              styles={{
                root: { width: "200px" },
                container: { width: "200px" },
                callout: {
                  width: "100%",
                  maxHeight: 5 * 36,
                  overflowY: "auto",
                },
                optionsContainerWrapper: {
                  maxHeight: 5 * 36,
                  overflowY: "auto",
                },
                input: { width: "100%" },
              }}
            />
            {utpFilters.caseNumber && (
              <button
                type="button"
                onClick={() => handleUtpFilterChange("caseNumber", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Entity */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <Dropdown
              label="Entity"
              placeholder="Select Entity"
              options={lovOptions.Entity || []}
              selectedKey={utpFilters.entity || null}
              onChange={(_, option) =>
                handleUtpFilterChange("entity", option?.key as string)
              }
              styles={{ root: { minWidth: 160 } }}
            />
            {utpFilters.entity && (
              <button
                type="button"
                onClick={() => handleUtpFilterChange("entity", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Tax Type */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <Dropdown
              label="Tax Type"
              placeholder="Select Tax Type"
              options={lovOptions["Tax Type"] || []}
              selectedKey={utpFilters.taxType || null}
              onChange={(_, option) =>
                handleUtpFilterChange("taxType", option?.key as string)
              }
              styles={{ root: { minWidth: 160 } }}
            />
            {utpFilters.taxType && (
              <button
                type="button"
                onClick={() => handleUtpFilterChange("taxType", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Tax Authority */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <Dropdown
              label="Tax Authority"
              placeholder="Select Tax Authority"
              options={lovOptions["Tax Authority"] || []}
              selectedKey={utpFilters.taxAuthority || null}
              onChange={(_, option) =>
                handleUtpFilterChange("taxAuthority", option?.key as string)
              }
              styles={{ root: { minWidth: 160 } }}
            />
            {utpFilters.taxAuthority && (
              <button
                type="button"
                onClick={() => handleUtpFilterChange("taxAuthority", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Tax Year */}
          <div
            style={{
              position: "relative",
              display: "inline-block",
            }}
          >
            {utpFilters.taxType === "Sales Tax" ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontWeight: "600" }}>Tax Year</label>
                <ReactDatePicker
                  selected={
                    utpFilters.taxYear
                      ? (() => {
                          try {
                            if (/^\d{2}\/\d{4}$/.test(utpFilters.taxYear)) {
                              const [month, year] =
                                utpFilters.taxYear.split("/");
                              return new Date(
                                Number(year),
                                Number(month) - 1,
                                1
                              );
                            } else if (!isNaN(Date.parse(utpFilters.taxYear))) {
                              return new Date(utpFilters.taxYear);
                            }
                            return null;
                          } catch {
                            return null;
                          }
                        })()
                      : null
                  }
                  onChange={(date: Date | null) => {
                    if (date) {
                      const formatted = `${String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      )}/${date.getFullYear()}`;
                      handleUtpFilterChange("taxYear", formatted);
                    } else {
                      handleUtpFilterChange("taxYear", "");
                    }
                  }}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  placeholderText="Select month and year"
                  className={styles.datePickerInput}
                />
              </div>
            ) : (
              <Dropdown
                label="Tax Year"
                placeholder="Select Tax Year"
                options={getTaxYearOptions()}
                selectedKey={utpFilters.taxYear || null}
                onChange={(_, option) =>
                  handleUtpFilterChange("taxYear", option?.key as string)
                }
                styles={{
                  root: { width: "160px" },
                  dropdown: { width: "100%" },
                  callout: {
                    width: "100%",
                    maxHeight: 5 * 36,
                    overflowY: "auto",
                  },
                  title: { width: "160px" },
                }}
              />
            )}
            {utpFilters.taxYear && (
              <button
                type="button"
                onClick={() => handleUtpFilterChange("taxYear", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Financial Year */}
          <div style={{ position: "relative", display: "inline-block" }}>
            {utpFilters.taxType === "Sales Tax" ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontWeight: "600", marginBottom: "0px" }}>
                  Financial Year
                </label>
                <ReactDatePicker
                  selected={
                    utpFilters.financialYear
                      ? (() => {
                          try {
                            if (
                              /^\d{2}\/\d{4}$/.test(utpFilters.financialYear)
                            ) {
                              const [month, year] =
                                utpFilters.financialYear.split("/");
                              return new Date(
                                Number(year),
                                Number(month) - 1,
                                1
                              );
                            } else if (
                              !isNaN(Date.parse(utpFilters.financialYear))
                            ) {
                              return new Date(utpFilters.financialYear);
                            }
                            return null;
                          } catch {
                            return null;
                          }
                        })()
                      : null
                  }
                  onChange={(date: Date | null) => {
                    if (date) {
                      const formatted = `${String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      )}/${date.getFullYear()}`;
                      handleUtpFilterChange("financialYear", formatted);
                    } else {
                      handleUtpFilterChange("financialYear", "");
                    }
                  }}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  placeholderText="Select month and year"
                  className={styles.datePickerInput}
                />
              </div>
            ) : (
              <Dropdown
                label="Financial Year"
                placeholder="Select Financial Year"
                options={getFinancialYearOptions()}
                selectedKey={utpFilters.financialYear || null}
                onChange={(_, option) =>
                  handleUtpFilterChange("financialYear", option?.key as string)
                }
                styles={{
                  root: { width: "160px" },
                  dropdown: { width: "100%" },
                  callout: {
                    width: "100%",
                    maxHeight: 5 * 36,
                    overflowY: "auto",
                  },
                  title: { width: "160px" },
                }}
              />
            )}
            {utpFilters.financialYear && (
              <button
                type="button"
                onClick={() =>
                  handleUtpFilterChange("financialYear", undefined)
                }
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Category */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <Dropdown
              label="Category"
              placeholder="Select Category"
              options={lovOptions["Risk Category"] || []}
              selectedKey={utpFilters.category || null}
              onChange={(_, option) =>
                handleUtpFilterChange("category", option?.key as string)
              }
              styles={{ root: { minWidth: 160 } }}
            />
            {utpFilters.category && (
              <button
                type="button"
                onClick={() => handleUtpFilterChange("category", undefined)}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "75%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888",
                }}
              >
                ✖
              </button>
            )}
          </div>

          <button
            type="button"
            className={styles.clearFiltersButton}
            onClick={() => {
              setUtpFilters({
                entity: "",
                category: "",
                financialYear: "",
                taxYear: "",
                taxType: "",
                taxAuthority: "",
                caseNumber: "",
              });
              setFilteredUtpData(utpData);
              setUtpPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>UTP ID</th>
              <th>GMLR ID</th>
              <th>GRS Code</th>
              <th>ERM Unique Numbering</th>
              <th>Gross Exposure</th>
              <th>Tax Type</th>
              <th>Approval Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.ID}>
                <td>{item.UTPId}</td>
                <td>{item.GMLRID}</td>
                <td>{item.GRSCode}</td>
                <td>{item.ERMUniqueNumbering}</td>
                <td>{item.GrossExposure}</td>
                <td>{item.TaxType}</td>
                <td>
                  {item.Status && (
                    <div
                      style={{
                        backgroundColor:
                          item.Status === "Open" ? "#5ebd74" : "#20a5bb",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {item.Status}
                    </div>
                  )}
                </td>
                <td>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    title="View"
                    onClick={() => handleShow(item)}
                  >
                    👁
                  </Button>
                  <Button
                    variant="link"
                    className={styles.editBtn}
                    title="Edit"
                    onClick={() => {
                      setSelectedCase(item);
                      setActiveFormType("UTP");
                      setIsAddingNew(true);
                    }}
                    disabled={
                      item.CaseStatus === "Draft" &&
                      item.Author?.Id !== currentUser?.Id
                    }
                  >
                    ✏️
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          currentPage={utpPage}
          totalPages={totalPages}
          totalItems={utpData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setUtpPage}
        />
      </>
    );
  };
  const renderTabContent = () => {
    if (showLawyerManagement) {
      return <Lawyer SpfxContext={SpfxContext} onCancel={handleCancel} />;
    }
    if (showConsultantManagement) {
      return <Consultant SpfxContext={SpfxContext} onCancel={handleCancel} />;
    }
    if (showLOVManagement) {
      return <LOVManagement SpfxContext={SpfxContext} />;
    }
    if (showManageRole) {
      if (isAddingNew && activeFormType === "Role") {
        return <RoleForm SpfxContext={SpfxContext} onCancel={handleCancel} />;
      }
      return <ManageRole SpfxContext={SpfxContext} />;
    }

    if (isAddingNew) {
      if (activeFormType === "case") {
        return (
          <CaseForm
            existing={existing}
            setExisting={setExisting}
            SpfxContext={SpfxContext}
            onCancel={handleCancel}
            onSave={handleSave}
            loadCasesData={loadCasesData}
            selectedCase={selectedCase}
            notiID={notiID}
          />
        );
      } else if (activeFormType === "correspondenceOut") {
        return (
          <CorrespondenceOutForm
            SpfxContext={SpfxContext}
            onCancel={handleCancel}
            onSave={handleSave}
            selectedCase={selectedCase}
            notiID={notiID}
          />
        );
      } else if (activeTab === "UTP Dashboard") {
        return (
          <UTPForm
            SpfxContext={SpfxContext}
            onCancel={handleCancel}
            onSave={handleSave}
            selectedCase={selectedCase}
            loadUtpData={loadUTPData}
          />
        );
      }
    }

    switch (activeTab) {
      case "Dashboard":
        return (
          <PowerBIDashboard
            SpfxContext={SpfxContext}
            attachments={attachments}
          />
        );
      case "Litigation":
        return renderCorrespondenceTable();
      case "Response":
        return renderCorrespondenceOutTable();
      case "UTP Dashboard":
        return renderUTPTable();

      case "Email Notification":
        return (
          <Notifications
            newAdd={() => setIsAddingNew(true)}
            setSelectedCase={setSelectedCase}
            setExisting={setExisting}
            SpfxContext={SpfxContext}
            setNotiID={setNotiID}
            activeFormOut={() => setActiveFormType("correspondenceOut")}
            activeForm={() => setActiveFormType("case")}
          />
        );

      case "Documents":
        return <DocumentGrid SpfxContext={SpfxContext} />;

      case "Reports":
        return (
          <ReportsTable SpfxContext={SpfxContext} reportType={reportType} />
        );

      // case "Managers":
      // return <ManagersTable SpfxContext={SpfxContext} />;

      default:
        return null;
    }
  };

  return (
    <>
      <div className={styles.tabs}>
        <div className={styles.leftSection}>
          <img src={logo} alt="Jazz Logo" className={styles.logo} />
          <h1 className={styles.lmsHeading}>LMS</h1>
        </div>
        {visibleTabs.map((tab) => (
          <button
            type="button"
            key={tab}
            className={`${styles.tab} ${
              !showLOVManagement &&
              !showManageRole &&
              !showConsultantManagement &&
              !showLawyerManagement &&
              activeTab === tab
                ? styles.activeTab
                : ""
            }`}
            onClick={() => {
              setActiveTab(tab);
              setIsAddingNew(false);
              setSelectedCase(null);
              setActiveFormType(null);
              setNotiID(null);
              setShowLOVManagement(false);
              setShowManageRole(false);
              setShowConsultantManagement(false);
              setShowLawyerManagement(false);
              setUtpFilters({
                entity: "",
                taxType: "",
                taxAuthority: "",
                taxYear: "",
                financialYear: "",
                category: "",
                caseNumber: "",
              });
              setCorrespondenceFilters({
                caseNumber: "",
                taxType: "",
                taxAuthority: "",
              });
              setFilters({
                Entity: "",
                taxType: "",
                taxAuthority: "",
                taxYear: "",
                financialYear: "",
                category: "",
                caseNumber: "",
              });
            }}
          >
            {tab}
          </button>
        ))}
        <div className={styles.navIcons}>
          {userPhoto ? (
            <img src={userPhoto} alt="User" className={styles.userPhoto} />
          ) : (
            <FontAwesomeIcon icon={faUser} className={styles.icon} />
          )}

          {isAdmin && (
            <div className={styles.dropdown}>
              <button
                type="button"
                className={styles.adminBtn}
                onClick={toggleDropdown}
              >
                ADMIN ▾
              </button>

              {showDropdown && (
                <div className={styles["dropdown-menu"]}>
                  <div
                    className={styles["dropdown-item"]}
                    onClick={() => {
                      onLOVManagementClick();
                      setShowDropdown(false);
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCog}
                      className={styles["dropdown-icon"]}
                    />
                    LOV Management
                  </div>
                  <div
                    className={styles["dropdown-item"]}
                    onClick={() => {
                      onManageRoleClick();
                      setShowDropdown(false);
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                      className={styles["dropdown-icon"]}
                    />
                    Manage Roles
                  </div>
                  <div
                    className={styles["dropdown-item"]}
                    onClick={() => {
                      onConsultantManagementClick();
                      setShowDropdown(false);
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCog}
                      className={styles["dropdown-icon"]}
                    />
                    Consultant Management
                  </div>
                  <div
                    className={styles["dropdown-item"]}
                    onClick={() => {
                      onLawyerManagementClick();
                      setShowDropdown(false);
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCog}
                      className={styles["dropdown-icon"]}
                    />
                    Lawyer Management
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div>
        <div className={styles.headerRow}>
          <h3 className={styles.activeTabTitle}>
            {showLOVManagement
              ? "LOV Management"
              : showManageRole
              ? "Manage Role"
              : showConsultantManagement
              ? ""
              : showLawyerManagement
              ? ""
              : activeTab}
          </h3>
          {(userRole.includes("admin") ||
            userRole.includes("tax litigation team")) &&
            !showLOVManagement &&
            !showConsultantManagement &&
            !showLawyerManagement &&
            (activeTab === "Litigation" ||
              activeTab === "Response" ||
              activeTab === "UTP Dashboard" ||
              showManageRole) &&
            !isAddingNew && (
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => {
                  setNotiID(null);
                  if (showManageRole) {
                    setActiveFormType("Role");
                  } else if (activeTab === "Litigation") {
                    setActiveFormType("case");
                  } else if (activeTab === "Response") {
                    setActiveFormType("correspondenceOut");
                  } else if (activeTab === "UTP Dashboard") {
                    setActiveFormType("UTP");
                  }
                  setIsAddingNew(true);
                }}
              >
                Add New
              </button>
            )}
        </div>
        <div className={styles.headerRow2}>
          <h6 className={styles.activeTabTitle2}>
            Home <span style={{ color: "red" }}>&gt;</span>{" "}
            {showLOVManagement
              ? "LOV Management"
              : showManageRole
              ? "Manage Role"
              : showConsultantManagement
              ? "Consultant Management"
              : showLawyerManagement
              ? "Lawyer Management"
              : activeTab}
          </h6>
          {/* Report Type Tabs */}
          {activeTab == "Reports" &&
            !showLOVManagement &&
            !showManageRole &&
            !showConsultantManagement &&
            !showLawyerManagement && (
              <div className={styles.reportTabs}>
                {(
                  [
                    { key: "UTP", text: "UTP Report" },
                    { key: "Litigation", text: "Litigation Report" },
                    { key: "ActiveCases", text: "Active Cases Weekly" },
                    {
                      key: "Provisions1",
                      text: "Provisions-GL code wise summary	",
                    },
                    { key: "Provisions2", text: "Provisions-Case wise list" },
                    { key: "Provisions3", text: "Exposure wise breakdown" },

                    { key: "Contingencies", text: "Contingencies Breakup" },
                    // { key: "ERM", text: "ERM Foreign Currency" },
                  ] as { key: ReportType; text: string }[]
                ).map((tab) => (
                  <button
                    type="button"
                    key={tab.key}
                    className={`${styles.tabButton} ${
                      reportType == tab.key ? styles.activeTab2 : ""
                    }`}
                    onClick={() => setReportType(tab.key)}
                  >
                    {tab.text}
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

      <div className={styles.tableContainer}>{renderTabContent()}</div>

      {/* Offcanvas for viewing case details */}
      <Offcanvas
        show={showOffcanvas}
        onHide={handleClose}
        placement="end"
        style={{
          width: activeTab === "UTP Dashboard" ? "1280px" : "850px",
        }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>View Case Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedCase && activeTab === "Litigation" && (
            <ViewCaseForm
              caseData={selectedCase}
              attachments={attachments}
              onClose={handleClose}
              show={false}
              SpfxContext={SpfxContext}
            />
          )}

          {selectedCase && activeTab === "Response" && (
            <ViewCorrespondenceOutForm
              caseData={selectedCase}
              attachments={attachments}
              onClose={handleClose}
              show={false}
            />
          )}

          {selectedCase && activeTab === "UTP Dashboard" && (
            <ViewUTPForm
              utpData={selectedCase}
              attachments={attachments}
              onClose={handleClose}
              show={false}
              SpfxContext={SpfxContext}
            />
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default React.memo(TabbedTables);
