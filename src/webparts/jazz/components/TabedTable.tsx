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

const tabs = [
  "Email Notification",
  "Correspondence In",
  "Correspondence Out",
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
}> = ({ SpfxContext, showLOVManagement, setShowLOVManagement }) => {
  const [activeTab, setActiveTab] = useState("Correspondence In");
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

  const [activeFormType, setActiveFormType] = useState<
    "case" | "correspondenceOut" | "UTP" | "LOV" | null
  >(null);
  // const [showLOVManagement, setShowLOVManagement] = useState(false);
  const [casesPage, setCasesPage] = useState(1);
  const [correspondencePage, setCorrespondencePage] = useState(1);
  const [utpPage, setUtpPage] = useState(1);

  const itemsPerPage = 10;

  const sp = spfi().using(SPFx(SpfxContext));

  useEffect(() => {
    if (activeTab === "Correspondence In") {
      loadCasesData();
    } else if (activeTab === "Correspondence Out") {
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
          "UTPId"
        )
        .orderBy("ID", false)
        .expand("Author", "Editor")();
      setUtpData(items);
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
  };

  const handleShow = async (item: any) => {
    setSelectedCase(item);

    let type: "case" | "correspondenceOut" | "UTP";
    if (activeTab === "Correspondence In") {
      type = "case";
    } else if (activeTab === "Correspondence Out") {
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

  const renderCorrespondenceTable = () => {
    const totalPages = Math.ceil(casesData.length / itemsPerPage);
    const paginatedData = casesData.slice(
      (casesPage - 1) * itemsPerPage,
      casesPage * itemsPerPage
    );

    return (
      <>
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
                    ? `00-CN${item.ParentCaseId}`
                    : `00-CN${item.ID}`}
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
    const paginatedData = correspondenceOutData.slice(
      (correspondencePage - 1) * itemsPerPage,
      correspondencePage * itemsPerPage
    );
    return (
      <>
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
    const paginatedData = utpData.slice(
      (utpPage - 1) * itemsPerPage,
      utpPage * itemsPerPage
    );
    return (
      <>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>UTP ID</th>
              <th>GMLR ID</th>
              <th>GRS Code</th>
              <th>ERM Unique Numbering</th>
              <th>Gross Exposure</th>
              <th>Cash Flow Exposure</th>
              <th>Tax Matter</th>
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
                <td>{item.TaxMatter}</td>
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
      case "Correspondence In":
        return renderCorrespondenceTable();
      case "Correspondence Out":
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
        return <ReportsTable SpfxContext={SpfxContext} reportType={reportType} />;

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
            className={`${styles.tab} ${!showLOVManagement && activeTab === tab ? styles.activeTab : ""
              }`}
            onClick={() => {
              setActiveTab(tab);
              setIsAddingNew(false);
              setSelectedCase(null); // reset form data
              setActiveFormType(null); // reset form type
              setNotiID(null); // clear notifications if any
              setShowLOVManagement(false); // back to normal mode
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        <div className={styles.headerRow}>
          <h3 className={styles.activeTabTitle}>
            {showLOVManagement ? "LOV Management" : activeTab}
          </h3>
          {(activeTab === "Correspondence In" ||
            activeTab === "Correspondence Out" ||
            activeTab === "UTP Dashboard" ||
            showLOVManagement) &&
            !isAddingNew && (
              <button
                className={styles.addBtn}
                onClick={() => {
                  setNotiID(null);
                  if (showLOVManagement) {
                    setActiveFormType("LOV");
                  } else if (activeTab === "Correspondence In") {
                    setActiveFormType("case");
                  } else if (activeTab === "Correspondence Out") {
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
            {showLOVManagement ? "LOV Management" : activeTab}
          </h6>
          {/* Report Type Tabs */}
          {activeTab == "Reports" && <div className={styles.reportTabs}>
            {([
              { key: "UTP", text: "UTP Report" },
              { key: "Litigation", text: "Litigation Report" },
              { key: "ActiveCases", text: "Active Cases Weekly" },
              { key: "Provisions1", text: "Provisions Report - 1" },
              { key: "Provisions2", text: "Provisions Report - 2" },
              { key: "Contingencies", text: "Contingencies Breakup" },
              { key: "ERM", text: "ERM Foreign Currency" }
            ] as { key: ReportType; text: string }[]).map(tab => (
              <button
                key={tab.key}
                className={`${styles.tabButton} ${reportType == tab.key ? styles.activeTab2 : ""
                  }`}
                onClick={() => setReportType(tab.key)}
              >
                {tab.text}
              </button>
            ))}
          </div>}

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
          {selectedCase && activeTab === "Correspondence In" && (
            <ViewCaseForm
              caseData={selectedCase}
              attachments={attachments}
              onClose={handleClose}
              show={false}
            />
          )}

          {selectedCase && activeTab === "Correspondence Out" && (
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
