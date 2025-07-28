/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useEffect, useState } from "react";
import styles from "./TabedTables.module.scss";
import CaseForm from "./CaseForm";
import { spfi, SPFx } from "@pnp/sp";

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
          "ID",
          "Title",
          "DocumentReferenceNo",
          "CorrespondenceType",
          "DateReceived",
          "FinancialYear",
          "DateofCompliance",
          "LawyerAssigned",
          "GrossTaxDemanded",
          "CaseStatus"
        )();
      setCasesData(items);
    } catch (err) {
      console.error("Error fetching data from Cases list:", err);
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
  };

  const handleSave = (formData: any) => {
    console.log("Form Submitted:", formData);
    setIsAddingNew(false);
    loadCasesData(); // Reload table after saving
  };

  const renderCorrespondenceTable = () => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Case No</th>
          <th>Doc Reference No</th>
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
            <td>{item.DocumentReferenceNo}</td>
            <td>{item.CorrespondenceType}</td>
            <td>{item.DateReceived?.split("T")[0]}</td>
            <td>{item.FinancialYear}</td>
            <td>{item.DateofCompliance?.split("T")[0]}</td>
            <td>{item.LawyerAssigned}</td>
            <td>{item.GrossTaxDemanded}</td>
            <td>{item.CaseStatus}</td>
            <td>
              <button className={styles.eyeBtn} title="View">
                👁
              </button>
              <button className={styles.editBtn} title="Edit">
                ✏️
              </button>
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
    <div>
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
    </div>
  );
};

export default TabbedTables;
