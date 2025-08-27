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
import ManagersTable from "./ManagersTable";
import ViewUTPForm from "./ViewUTPForm";
import DocumentGrid from "./DocumentGrid";
import ReportsTable from "./ReportsTable";
import LOVManagement from "./LOVManagement";
import Notifications from "./Notifications";
import LOVForm from "./LOVForm";
import Pagination from "./Pagination";
import { Dropdown, IDropdownOption } from "@fluentui/react";
import { ComboBox } from "@fluentui/react";
import PowerBIDashboard from "./PowerBIDashboard";
import ManageRole from "./ManageRole";
import RoleForm from "./RoleForm";

const tabs = [
  "Dashboard",
  "Email Notification",
  "Litigation",
  "Response",
  "UTP Dashboard",
  "Documents",
  "Reports",
  "Managers",
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
}> = ({
  SpfxContext,
  showLOVManagement,
  setShowLOVManagement,
  showManageRole,
  setShowManageRole,
}) => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [casesData, setCasesData] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [notiID, setNotiID] = useState<any>(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [existing, setExisting] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [correspondenceOutData, setCorrespondenceOutData] = useState<any[]>([]);
  const [utpData, setUtpData] = useState<any[]>([]);
  const [reportType, setReportType] = useState<ReportType>("UTP");
  const [filters, setFilters] = useState({
    Entity: "",
    category: "",
    financialYear: "",
    taxYear: "",
    taxType: "",
    taxAuthority: "",
  });
  const [correspondenceFilters, setCorrespondenceFilters] = useState({
    caseNumber: "",
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
  });
  const [filteredUtpData, setFilteredUtpData] = useState<any[]>([]);
  const [activeFormType, setActiveFormType] = useState<
    "case" | "correspondenceOut" | "UTP" | "LOV" | "Role" | null
  >(null);
  // const [showLOVManagement, setShowLOVManagement] = useState(false);
  const [casesPage, setCasesPage] = useState(1);
  const [correspondencePage, setCorrespondencePage] = useState(1);
  const [utpPage, setUtpPage] = useState(1);

  const itemsPerPage = 10;

  const sp = spfi().using(SPFx(SpfxContext));

  useEffect(() => {
    if (activeTab === "Litigation") {
      loadCasesData();
    } else if (activeTab === "Response") {
      loadCorrespondenceOutData();
    } else if (activeTab === "UTP Dashboard") {
      loadUTPData();
    }
  }, [activeTab]);
  const loadCorrespondenceOutData = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle("CorrespondenceOut")
        .items.select(
          "*",
          "ID",
          "Title",
          "Dateoffiling",
          "FiledAt",
          "Filedthrough",
          "BriefDescription",
          "CaseNumber/ID",
          "CaseNumber/Title",
          "Author/Title",
          "Editor/Title"
        )
        .expand("CaseNumber", "Author", "Editor")
        .orderBy("ID", false)();
      setCorrespondenceOutData(items);
      setFilteredCorrespondenceOutData(items);
      console.log("Correspondence Out data:", items);
    } catch (err) {
      console.error("Error fetching data from Correspondence Out list:", err);
    }
  };

  const loadCasesData = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle("Cases")
        .items.select(
          "*",
          "ID",
          "Title",
          "CorrespondenceType",
          "DateReceived",
          "FinancialYear",
          "DateofCompliance",
          "LawyerAssigned/Title",
          "GrossTaxDemanded",
          "CaseStatus",
          "Author/Title",
          "Editor/Title"
        )
        .expand("Author", "Editor", "LawyerAssigned")
        .orderBy("ID", false)();
      setCasesData(items);
      setFilteredData(items);
      console.log("Cases data:", items);
    } catch (err) {
      console.error("Error fetching data from Cases list:", err);
    }
  };

  const loadUTPData = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle("UTPData")
        .items.select(
          "*",
          "ID",
          "Title",
          "GMLRID",
          "GRSCode",
          "ERMUniqueNumbering",
          "GrossExposure",
          "CashFlowExposure",
          "TaxMatter/Title",
          "PaymentType/Title",
          "Status",
          "Author/Title",
          "Editor/Title",
          "UTPId",
          "ParentCase/Id",
          "ParentCase/TaxType"
        )
        .orderBy("ID", false)
        .expand("Author", "Editor", "ParentCase")();
      setUtpData(items);
      setFilteredUtpData(items);
      console.log("UTP data:", items);
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

      console.log("Fetched attachments:", files);
      setAttachments(files);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const handleCancel = () => {
    setExisting(false);

    setIsAddingNew(false);
    setSelectedCase(null);
  };

  const handleSave = (formData: any) => {
    setExisting(false);

    console.log("Form Submitted:", formData);
    setIsAddingNew(false);
    setSelectedCase(null);
    if (activeFormType === "case") loadCasesData();
    else if (activeFormType === "correspondenceOut")
      loadCorrespondenceOutData();
    if (activeFormType === "UTP") loadUTPData();
    if (activeFormType === "LOV") {
      setShowLOVManagement(true);
    }
    if (activeFormType === "Role") {
      setShowManageRole(true);
    }
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
  React.useEffect(() => {
    if (showLOVManagement) {
      setShowManageRole(false);
    }
  }, [showLOVManagement]);

  React.useEffect(() => {
    if (showManageRole) {
      setShowLOVManagement(false);
    }
  }, [showManageRole]);

  const renderCorrespondenceTable = () => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
      (casesPage - 1) * itemsPerPage,
      casesPage * itemsPerPage
    );
    const handleFilterChange = (key: string, value: string) => {
      const updatedFilters = { ...filters, [key]: value };
      setFilters(updatedFilters);

      const filtered = casesData.filter((item) => {
        return (
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

      // 👇 reset to first page after filtering
      setCasesPage(1);
    };

    return (
      <>
        <div className={styles.filtersRow}>
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

          <button
            className={styles.clearFiltersButton}
            onClick={() => {
              setFilters({
                Entity: "",
                category: "",
                financialYear: "",
                taxYear: "",
                taxType: "",
                taxAuthority: "",
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
              <th>Gross Tax Demanded</th>
              <th>Case Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.ID}>
                <td>
                  {item.ParentCaseId
                    ? item.TaxType === "Income Tax"
                      ? `IT--00${item.ParentCaseId}`
                      : item.TaxType === "Sales Tax"
                      ? `ST--00${item.ParentCaseId}`
                      : `CN--00${item.ParentCaseId}` // fallback for other types
                    : item.Title}
                </td>
                <td>{item.CorrespondenceType}</td>
                <td>{item.DateReceived?.split("T")[0]}</td>
                <td>{item.FinancialYear}</td>
                <td>{item.DateofCompliance?.split("T")[0]}</td>
                <td>{item.LawyerAssigned?.Title}</td>
                <td>{item.GrossTaxDemanded}</td>
                <td>
                  {item.CaseStatus && (
                    <div
                      style={{
                        backgroundColor:
                          item.CaseStatus === "Active" ? "#5ebd74" : "#20a5bb",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {item.CaseStatus}
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
    const handleCorrespondenceFilterChange = (key: string, value: string) => {
      const updatedFilters = { ...correspondenceFilters, [key]: value };
      setCorrespondenceFilters(updatedFilters);

      const filtered = correspondenceOutData.filter((item) => {
        return (
          !updatedFilters.caseNumber ||
          item.CaseNumber?.Title?.toLowerCase().includes(
            updatedFilters.caseNumber.toLowerCase()
          )
        );
      });

      setFilteredCorrespondenceOutData(filtered);
      setCorrespondencePage(1);
    };

    return (
      <>
        <div className={styles.filtersRow}>
          <ComboBox
            label="Case Number"
            placeholder="Select or type Case Number"
            allowFreeform
            autoComplete="on"
            options={Array.from(
              new Set(correspondenceOutData.map((i) => i.CaseNumber?.Title))
            )
              .filter(Boolean)
              .map((cn) => ({
                key: cn,
                text: `CN-00${cn}`,
              }))}
            text={correspondenceFilters.caseNumber || ""}
            onChange={(_, option, __, value) => {
              const newValue = option ? (option.key as string) : value || "";
              handleCorrespondenceFilterChange("caseNumber", newValue);
            }}
            styles={{ root: { minWidth: 200 } }}
          />

          <button
            className={styles.clearFiltersButton}
            onClick={() => {
              setCorrespondenceFilters({ caseNumber: "" });
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
              <th>CorrespondenceOut</th>
              <th>Brief Description</th>
              <th>Field Through</th>
              <th>Field At</th>
              <th>Date Of Filling</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.ID}>
                <td>00-CN{item.CaseNumber?.Title}</td>
                <td>{item.CorrespondenceOut}</td>
                <td>{item.BriefDescription}</td>
                <td>{item.Filedthrough}</td>
                <td>{item.FiledAt}</td>
                <td>{item.Dateoffiling?.split("T")[0]}</td>
                <td>{item.Status}</td>
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

    const handleUtpFilterChange = (key: string, value: string) => {
      const updatedFilters = { ...utpFilters, [key]: value };
      setUtpFilters(updatedFilters);

      const filtered = utpData.filter((item) => {
        return (
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
          <Dropdown
            label="Tax Authority"
            placeholder="Select Tax Authority"
            options={lovOptions.TaxAuthority || []}
            selectedKey={utpFilters.taxAuthority || null}
            onChange={(_, option) =>
              handleUtpFilterChange("taxAuthority", option?.key as string)
            }
            styles={{ root: { minWidth: 160 } }}
          />

          <Dropdown
            label="Tax Year"
            placeholder="Select Tax Year"
            options={lovOptions["Tax Year"] || []}
            selectedKey={utpFilters.taxYear || null}
            onChange={(_, option) =>
              handleUtpFilterChange("taxYear", option?.key as string)
            }
            styles={{ root: { minWidth: 160 } }}
          />

          <Dropdown
            label="Financial Year"
            placeholder="Select Financial Year"
            options={lovOptions["FinancialYear"] || []}
            selectedKey={utpFilters.financialYear || null}
            onChange={(_, option) =>
              handleUtpFilterChange("financialYear", option?.key as string)
            }
            styles={{ root: { minWidth: 160 } }}
          />
          <Dropdown
            label="Category"
            placeholder="Select Category"
            options={lovOptions.Category || []}
            selectedKey={utpFilters.category || null}
            onChange={(_, option) =>
              handleUtpFilterChange("category", option?.key as string)
            }
            styles={{ root: { minWidth: 160 } }}
          />

          <button
            className={styles.clearFiltersButton}
            onClick={() => {
              setUtpFilters({
                entity: "",
                category: "",
                financialYear: "",
                taxYear: "",
                taxType: "",
                taxAuthority: "",
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
              <th>Cash Flow Exposure</th>
              <th>Tax Type</th>
              <th>Payment Type</th>
              <th>Status</th>
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
                <td>{item.CashFlowExposure}</td>
                <td>{item.TaxType}</td>
                <td>{item.PaymentType}</td>
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
    if (showLOVManagement) {
      if (isAddingNew && activeFormType === "LOV") {
        return <LOVForm SpfxContext={SpfxContext} onCancel={handleCancel} />;
      }
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
          />
        );
      } else if (activeTab === "UTP Dashboard") {
        return (
          <UTPForm
            SpfxContext={SpfxContext}
            onCancel={handleCancel}
            onSave={handleSave}
            selectedCase={selectedCase}
            loadUtpData={loadUTPData()}
          />
        );
      }
    }

    switch (activeTab) {
      case "Dashboard":
        return <PowerBIDashboard />;
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
            activeForm={() => setActiveFormType("case")}
          />
        );

      case "Documents":
        return <DocumentGrid SpfxContext={SpfxContext} />;

      case "Reports":
        return (
          <ReportsTable SpfxContext={SpfxContext} reportType={reportType} />
        );

      case "Managers":
        return <ManagersTable SpfxContext={SpfxContext} />;

      default:
        return null;
    }
  };

  return (
    <>
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${
              !showLOVManagement && !showManageRole && activeTab === tab
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
              setShowLOVManagement(false);
              setUtpFilters({
                entity: "",
                taxType: "",
                taxAuthority: "",
                taxYear: "",
                financialYear: "",
                category: "",
              });
              setCorrespondenceFilters({ caseNumber: "" });
              setFilters({
                Entity: "",
                taxType: "",
                taxAuthority: "",
                taxYear: "",
                financialYear: "",
                category: "",
              });
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        <div className={styles.headerRow}>
          <h3 className={styles.activeTabTitle}>
            {showLOVManagement
              ? "LOV Management"
              : showManageRole
              ? "Manage Role"
              : activeTab}
          </h3>
          {(activeTab === "Litigation" ||
            activeTab === "Response" ||
            activeTab === "UTP Dashboard" ||
            showLOVManagement ||
            showManageRole) &&
            !isAddingNew && (
              <button
                className={styles.addBtn}
                onClick={() => {
                  setNotiID(null);

                  if (showLOVManagement) {
                    setActiveFormType("LOV");
                  } else if (showManageRole) {
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
              : activeTab}
          </h6>
          {/* Report Type Tabs */}
          {activeTab == "Reports" && (
            <div className={styles.reportTabs}>
              {(
                [
                  { key: "UTP", text: "UTP Report" },
                  { key: "Litigation", text: "Litigation Report" },
                  { key: "ActiveCases", text: "Active Cases Weekly" },
                  { key: "Provisions1", text: "Provisions Report - 1" },
                  { key: "Provisions2", text: "Provisions Report - 2" },
                  { key: "Provisions3", text: "Provisions Report - 3" },

                  { key: "Contingencies", text: "Contingencies Breakup" },
                  // { key: "ERM", text: "ERM Foreign Currency" },
                ] as { key: ReportType; text: string }[]
              ).map((tab) => (
                <button
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
        style={{ width: "800px" }}
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
            />
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default TabbedTables;
