/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import ManagerDetailsDrawer from "./ManagerDetailsDrawer";
import styles from "./TabedTables.module.scss";
import { spfi, SPFx } from "@pnp/sp";

const ManagersTable: React.FC<{ SpfxContext: any }> = ({ SpfxContext }) => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [casesData, setCasesData] = useState<any[]>([]);
  const sp = spfi().using(SPFx(SpfxContext));

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
  const handleView = (item: any) => {
    setSelectedCase(item);
    setShowDrawer(true);
  };
  useEffect(() => {
    loadCasesData();
  }, []);
  return (
    <>
      <h4>Content area</h4>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Case No</th>
            <th>Authority</th>
            <th>Jurisdiction</th>
            <th>Consultant</th>
            <th>Brief description</th>
            <th>Complain</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {casesData.map((item, index) => (
            <tr key={item.ID}>
              <td>{index + 1}</td>
              <td>
                {item.ParentCaseId
                  ? `00-CN${item.ParentCaseId}`
                  : `00-CN${item.ID}`}
              </td>
              <td>{item.TaxAuthority}</td>
              <td>{item.Jurisdiction}</td>
              <td>{item.TaxConsultantAssigned}</td>
              <td>{item.BriefDescription}</td>
              <td> {item.CaseStatus}</td>
              <td>
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={() => handleView(item)}
                >
                  👁
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ManagerDetailsDrawer
        show={showDrawer}
        SpfxContext={SpfxContext}
        onHide={() => setShowDrawer(false)}
        caseData={selectedCase}
        loadCasesData={loadCasesData}
      />
    </>
  );
};

export default ManagersTable;
