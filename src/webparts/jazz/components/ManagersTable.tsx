/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import ManagerDetailsDrawer from "./ManagerDetailsDrawer";
import styles from "./TabedTables.module.scss";
import { spfi, SPFx } from "@pnp/sp";
import Pagination from "./Pagination";

const ManagersTable: React.FC<{ SpfxContext: any }> = ({ SpfxContext }) => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [casesData, setCasesData] = useState<any[]>([]);
  const sp = spfi().using(SPFx(SpfxContext));

  const loadCasesData = async () => {
  try {
    // 1. Fetch Cases
    const items = await sp.web.lists
      .getByTitle("Cases")
      .items.select(
        "*",
        "Author/Id", "Author/Title",
        "Editor/Id", "Editor/Title",
        "LawyerAssigned/Id", "LawyerAssigned/Title"
      )
      .expand("Author", "Editor", "LawyerAssigned")
      .orderBy("ID", false)();

    // 2. Fetch UTPData (only CaseNumberId, no need for deep lookup here)
    const items2 = await sp.web.lists
      .getByTitle("UTPData")
      .items.select(
        "*",
        "Author/Id", "Author/Title",
        "Editor/Id", "Editor/Title",
        "CaseNumberId" // just bring the lookup ID
      )
      .expand("Author", "Editor")
      .orderBy("ID", false)();

    // 3. Normalize Cases
    const normalizedCases = items.map((item: any) => ({
      id: item.ID,
      caseNo: item.ParentCaseId
        ? item.TaxType === "Income Tax"
          ? `IT-0${item.ParentCaseId}`
          : item.TaxType === "Sales Tax"
          ? `ST-0${item.ParentCaseId}`
          : `CN-0${item.ParentCaseId}`
        : item.Title,
      authority: item.TaxAuthority,
      jurisdiction: item.Jurisdiction,
      consultant: item.TaxConsultantAssigned,
      description: item.BriefDescription,
      approvalStatus: item.ApprovalStatus ,
      TaxType: item.TaxType,
      type: "case",
      raw: item,
    }));

    // 4. Normalize UTP and merge with Cases (using CaseNumberId)
    const normalizedUTP = items2.map((item: any) => {
      const relatedCase = items.find((c: any) => c.ID === item.CaseNumberId);

      return {
        id: item.ID,
        caseNo: item.UTPId || item.Title,
        authority: relatedCase?.TaxAuthority || "-",
        jurisdiction: relatedCase?.Jurisdiction || "-",
        TaxType: relatedCase?.TaxType || "-",
        consultant: relatedCase?.TaxConsultantAssigned || "-",
        description: relatedCase?.BriefDescription || item.Description || "-",
        approvalStatus: item.ApprovalStatus|| "Pending",
        type: "utp",
        raw: { ...item, relatedCase },
      };
    });

    // 5. Combine
    setCasesData([...normalizedCases, ...normalizedUTP]);
    console.log("Cases data sample:", items[0], items2[0]);

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
  const [casesPage, setCasesPage] = useState(1);
  const itemsPerPage = 10;

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
            {/* <th>S.No</th> */}
            <th>Case No</th>
            <th>Authority</th>
            <th>Jurisdiction</th>
            <th>Consultant</th>
            <th>Brief description</th>
            <th>Approval Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item, index) => (
            <tr key={item.ID}>
            {/* <td>{index + 1}</td> */}
      <td>{item.caseNo}</td>
      <td>{item.authority}</td>
      <td>{item.jurisdiction}</td>
      <td>{item.consultant}</td>
      <td>{item.description}</td>
      <td>{item.approvalStatus}</td>
              <td>
                <Button
                  variant="outline-warning"
                  size="sm"
                    onClick={() => handleView(item)} // pass original for drawer
    
                >
                  👁
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        currentPage={casesPage}
        totalPages={totalPages}
        totalItems={casesData.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCasesPage}
      />
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
