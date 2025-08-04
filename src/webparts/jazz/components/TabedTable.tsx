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
  const sp = spfi().using(SPFx(SpfxContext));

  useEffect(() => {
    if (activeTab === "Correspondence In") {
      loadCasesData();
    }
  }, [activeTab]);

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
        .expand("Author", "Editor", "LawyerAssigned")();
      setCasesData(items);
      console.log("Cases data:", items);
    } catch (err) {
      console.error("Error fetching data from Cases list:", err);
    }
  };
  const fetchAttachments = async (caseId: number) => {
    try {
      const files = await sp.web.lists
        .getByTitle("Core Data Repositories")
        .items.filter(`CaseId eq ${caseId}`)
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
    await fetchAttachments(item.ID);
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
                variant="link"
                className={styles.eyeBtn}
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
      return (
        <CaseForm
          SpfxContext={SpfxContext}
          onCancel={handleCancel}
          onSave={handleSave}
          selectedCase={selectedCase}
        />
      );
    }

    switch (activeTab) {
      case "Correspondence In":
      case "Correspondence Out":
      case "UTP Dashboard":
        return renderCorrespondenceTable();

      case "Notification":
        return <p>No Notification data available yet.</p>;

      case "Documents":
        return <p>Upload or view documents here.</p>;

      case "Reports":
        return <p>Reports section under construction.</p>;

      case "Managers":
        return <p>Managers' overview coming soon.</p>;

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
              onClick={() => setIsAddingNew(true)}
            >
              + Add New
            </button>
          )}
      </div>

      <div className={styles.tableContainer}>{renderTabContent()}</div>

      {/* Offcanvas for viewing case details */}
      <Offcanvas
        show={showOffcanvas}
        onHide={handleClose}
        placement="end"
        style={{ width: "700px" }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>View Case Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedCase && (
            <ViewCaseForm
              caseData={selectedCase}
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