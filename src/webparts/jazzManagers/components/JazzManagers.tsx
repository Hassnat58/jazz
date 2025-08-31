import * as React from 'react';
import styles from './JazzManagers.module.scss';
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import ManagerDetailsDrawer from "./ManagerDetailsDrawer";
import { spfi, SPFx } from "@pnp/sp";
import Pagination from '../../jazz/components/Pagination';

const JazzManagers: React.FC<{ SpfxContext: any }> = ({ SpfxContext }) => {
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
   const [casesPage, setCasesPage] = useState(1);
  const itemsPerPage = 10;

const totalPages = Math.ceil(casesData.length / itemsPerPage);
      const paginatedData = casesData.slice(
      (casesPage - 1) * itemsPerPage,
      casesPage * itemsPerPage
    );
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
           {paginatedData.map((item, index) => (
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
}
export default JazzManagers