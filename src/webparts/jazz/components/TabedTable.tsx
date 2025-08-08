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

const tabs = [
  "Notification",
  "Correspondence In",
  "Correspondence Out",
  "UTP Dashboard",
  "Documents",
  "Reports",
  "Managers",
];

const TabbedTables: React.FC<{ SpfxContext: any }> = ({ SpfxContext }) => {
  const [activeTab, setActiveTab] = useState("Correspondence In");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [casesData, setCasesData] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [correspondenceOutData, setCorrespondenceOutData] = useState<any[]>([]);
  const [utpData, setUtpData] = useState<any[]>([]);
  const [activeFormType, setActiveFormType] = useState<
    "case" | "correspondenceOut" | "UTP" | null
  >(null);

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
          "UTPID",
          "GMLRID",
          "GRSCode",
          "ERMUniqueNumbering",
          "GrossExposure",
          "CashFlowExposure",
          "TaxMatter/Title",
          "PaymentType/Title",
          "Status",
          "Author/Title",
          "Editor/Title"
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
    setIsAddingNew(false);
    setSelectedCase(null);
  };

  const handleSave = (formData: any) => {
    console.log("Form Submitted:", formData);
    setIsAddingNew(false);
    setSelectedCase(null);
    loadCasesData();
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

  const renderCorrespondenceTable = () => (
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
        {casesData.map((item) => (
          <tr key={item.ID}>
            <td>00-CN{item.ID}</td>
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
              {/* <div
                style={{
                  backgroundColor:
                    item.CaseStatus === "Active" ? "#5ebd74" : "#20a5bb",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                {item.CaseStatus}
              </div> */}
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
                }}
              >
                ✏️
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  const renderCorrespondenceOutTable = () => (
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
        {correspondenceOutData.map((item) => (
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
  );
  const renderUTPTable = () => (
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
        {utpData.map((item) => (
          <tr key={item.ID}>
            <td>{item.UTPID}</td>
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
  );

  const renderTabContent = () => {
    if (isAddingNew) {
      if (activeFormType === "case") {
        return (
          <CaseForm
            SpfxContext={SpfxContext}
            onCancel={handleCancel}
            onSave={handleSave}
            selectedCase={selectedCase}
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

      case "Notification":
        return <p>No Notification data available yet.</p>;

      case "Documents":
        return <DocumentGrid SpfxContext={SpfxContext} />;

      case "Reports":
        return <ReportsTable SpfxContext={SpfxContext}/>;

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
              activeTab === tab ? styles.activeTab : ""
            }`}
            onClick={() => {
              setActiveTab(tab);
              setIsAddingNew(false);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.headerRow}>
        <h3 className={styles.activeTabTitle}>{activeTab}</h3>
        {(activeTab === "Correspondence In" ||
          activeTab === "Correspondence Out" ||
          activeTab === "UTP Dashboard") &&
          !isAddingNew && (
            <button
              className={styles.addBtn}
              onClick={() => {
                if (activeTab === "Correspondence In") {
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
