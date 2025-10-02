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

const ManagersTable: React.FC<{ SpfxContext: any }> = ({
  SpfxContext,
  // attachments,
}) => {
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
          "Author/Id",
          "Author/Title",
          "Editor/Id",
          "Editor/Title",
          "LawyerAssigned/Id",
          "LawyerAssigned/Title"
        )
        .expand("Author", "Editor", "LawyerAssigned")
        .filter("CaseStatus eq 'Pending' and ApprovalStatus eq 'Pending'")
        .orderBy("ID", false)();
      const items2 = await sp.web.lists
        .getByTitle("UTPData")
        .items.select(
          "*",
          "Author/Id",
          "Author/Title",
          "Editor/Id",
          "Editor/Title",
          "CaseNumber/Id",
          "CaseNumber/Title",
          "CaseNumber/TaxAuthority",
          "CaseNumber/TaxConsultantAssigned",
          "CaseNumber/TaxType"
        )
        .expand("Author", "Editor", "CaseNumber")
        .filter("Status eq 'Pending' and ApprovalStatus eq 'Pending'")
        .orderBy("ID", false)();

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
        consultant: item.TaxConsultantAssigned,
        description: item.BriefDescription,
        approvalStatus: item.ApprovalStatus,
        TaxType: item.TaxType,
        created: new Date(item.Created),
        type: "case",
        raw: item,
      }));

      // 4. Normalize UTPData
      const normalizedUTP = items2.map((item: any) => ({
        id: item.ID,
        caseNo: item.UTPId || item.Title,
        authority: item.CaseNumber?.TaxAuthority || "-",
        TaxType: item.CaseNumber?.TaxType || "-",
        consultant: item.CaseNumber?.TaxConsultantAssigned || "-",
        description:
          item.CaseNumber?.BriefDescription || item.Description || "-",
        approvalStatus: item.ApprovalStatus || "Pending",
        type: "utp",
        created: new Date(item.Created),
        raw: item,
      }));

      // 5. Merge both
      const combined = [...normalizedCases, ...normalizedUTP].sort(
        (a, b) => b.created.getTime() - a.created.getTime()
      );

      setCasesData(combined);
    } catch (err) {
      console.error("Error fetching data:", err);
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
            <th>Consultant</th>
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
              <td>{item.consultant}</td>
              <td>{item.approvalStatus}</td>
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
        // attachments={attachments}
        loadCasesData={loadCasesData}
      />
    </>
  );
};

export default ManagersTable;
