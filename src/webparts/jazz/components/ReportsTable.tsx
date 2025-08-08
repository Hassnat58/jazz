import * as React from "react";
import { useState, useEffect } from "react";
import styles from "./Reports.module.scss";
import CorrespondenceDetailOffCanvas from "./ReportsOffCanvas";
import { Button } from "react-bootstrap";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/attachments";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";

interface CaseItem {
  caseNo: string;
  docRef: string;
  type: string;
  attachment: string;
  dateReceived: string;
  fy: string;
  complianceDate: string;
  lawyer: string;
  amount: string;
  status: "Active" | "Inactive" | "Pending" | "Closed";
  entity: string;
  taxAuthority: string;
  jurisdiction: string;
  concerningLaw: string;
  briefDescription: string;
  issuedBy: string;
  caseBriefDescription: string;
  taxConsultant: string;
  emailTitle: string;
  hearingDate: string;
  nextForum: string;
  taxExposureStage: string;
  lastUpdated: string;
  owner: string;
  taxType: string;
  category:string;
  taxYear:string;
}


const dummyData: CaseItem[] = [
  {
    caseNo: "00-CN321",
    docRef: "REF-2025-0001",
    type: "Assessment Notice",
    attachment: "audit_report.pdf.xlsx",
    dateReceived: "03-15-2025",
    fy: "FY2024",
    complianceDate: "03-15-2025",
    lawyer: "Jane Smith",
    amount: "$50,000",
    status: "Active",
    entity: "Acme Corp",
    taxAuthority: "IRS",
    jurisdiction: "Federal",
    concerningLaw: "Income Tax Act",
    briefDescription: "Financial records require verification.",
    issuedBy: "IRS Audit Dept",
    caseBriefDescription:
      "The audit uncovered discrepancies in reported income and expenses.",
    taxConsultant: "John Doe",
    emailTitle: "Assessment Notice",
    hearingDate: "03-15-2025",
    nextForum: "Tax Court",
    taxExposureStage: "Assessment",
    lastUpdated: "07-14-2025",
    owner: "John Doe",
    taxType: "Income Tax",
    category:"",
    taxYear:"",

  },
  {
    caseNo: "00-CN322",
    docRef: "REF-2025-0002",
    type: "Penalty Notice",
    attachment: "penalty_notice.pdf",
    dateReceived: "04-10-2025",
    fy: "FY2020",
    complianceDate: "04-25-2025",
    lawyer: "Robert Black",
    amount: "$10,000",
    status: "Pending",
    entity: "LDNP",
    taxAuthority: "BRA",
    jurisdiction: "State",
    concerningLaw: "Sales Tax Act",
    briefDescription: "Late filing penalty notice issued.",
    issuedBy: "Revenue Enforcement",
    caseBriefDescription:
      "Entity failed to file sales tax returns by the due date.",
    taxConsultant: "Sarah Lee",
    emailTitle: "Penalty Notice",
    hearingDate: "05-01-2025",
    nextForum: "Appellate Tribunal",
    taxExposureStage: "Penalty",
    lastUpdated: "07-15-2025",
    owner: "Sarah Lee",
    taxType: "Income Tax",
    category:"Probable",
    taxYear:"2020",


  },
  {
    caseNo: "00-CN323",
    docRef: "REF-2025-0003",
    type: "Show Cause Notice",
    attachment: "show_cause.pdf",
    dateReceived: "05-05-2025",
    fy: "FY2023",
    complianceDate: "05-20-2025",
    lawyer: "Alice Green",
    amount: "$75,000",
    status: "Active",
    entity: "Gamma Inc",
    taxAuthority: "IRS",
    jurisdiction: "Federal",
    concerningLaw: "Corporate Tax Rules",
    briefDescription: "Unreported offshore transactions.",
    issuedBy: "IRS Compliance",
    caseBriefDescription:
      "Company did not disclose foreign income properly.",
    taxConsultant: "Tom Hardy",
    emailTitle: "Show Cause Notice",
    hearingDate: "06-01-2025",
    nextForum: "Review Board",
    taxExposureStage: "Investigation",
    lastUpdated: "07-20-2025",
    owner: "Tom Hardy",
    taxType: "Income Tax",
    category:"",
    taxYear:"",



  },
  {
    caseNo: "00-CN324",
    docRef: "REF-2025-0004",
    type: "Reassessment Order",
    attachment: "reassessment_order.pdf",
    dateReceived: "06-01-2025",
    fy: "FY2022",
    complianceDate: "06-30-2025",
    lawyer: "Emma White",
    amount: "$90,000",
    status: "Closed",
    entity: "Delta Partners",
    taxAuthority: "Local Tax Office",
    jurisdiction: "Municipal",
    concerningLaw: "Property Tax Code",
    briefDescription: "Reassessment due to undervalued property.",
    issuedBy: "Local Tax Officer",
    caseBriefDescription:
      "Property value was reassessed leading to additional tax.",
    taxConsultant: "Michael Scott",
    emailTitle: "Reassessment Order",
    hearingDate: "07-10-2025",
    nextForum: "Municipal Court",
    taxExposureStage: "Reassessment",
    lastUpdated: "07-30-2025",
    owner: "Michael Scott",
    taxType: "Income Tax",
    category:"",
    taxYear:"",


  },
  {
    caseNo: "00-CN325",
    docRef: "REF-2025-0005",
    type: "Assessment Order",
    attachment: "assessment_order_2025.pdf",
    dateReceived: "07-01-2025",
    fy: "FY2025",
    complianceDate: "07-20-2025",
    lawyer: "Liam Brown",
    amount: "$120,000",
    status: "Closed",
    entity: "Epsilon Co",
    taxAuthority: "IRS",
    jurisdiction: "Federal",
    concerningLaw: "Income Tax Act",
    briefDescription: "Major income mismatch flagged.",
    issuedBy: "IRS Regional Office",
    caseBriefDescription:
      "Large variance between reported and actual income triggered audit.",
    taxConsultant: "Rachel Adams",
    emailTitle: "Assessment Order FY2025",
    hearingDate: "08-05-2025",
    nextForum: "Federal Tribunal",
    taxExposureStage: "Assessment",
    lastUpdated: "08-01-2025",
    owner: "Rachel Adams",
    taxType: "Income Tax",
    category:"",
    taxYear:"",


  }
];



const ReportsTable: React.FC<{ SpfxContext: any }> = ({ SpfxContext }) => {
  const [show, setShow] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [lovOptions, setLovOptions] = useState<{
    [key: string]: IDropdownOption[];
  }>({});
  const [filters, setFilters] = useState({
    dateStart: "",
    dateEnd: "",
    category: "",
    financialYear: "",
    taxYear: "",
    taxType: "",
    taxAuthority: "",
    entity: ""
  });


  const [filteredData, setFilteredData] = useState<CaseItem[]>(dummyData);
  const sp = spfi().using(SPFx(SpfxContext));

  const handleShow = (item: CaseItem) => {
    setSelectedCase(item);
    setShow(true);
  };

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
  const handleFilterChange = (key: string, value: string) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);

    const filtered = dummyData.filter(item => {
      const itemDate = new Date(item.dateReceived);

      const startCheck = updatedFilters.dateStart
        ? itemDate >= new Date(updatedFilters.dateStart)
        : true;

      const endCheck = updatedFilters.dateEnd
        ? itemDate <= new Date(updatedFilters.dateEnd)
        : true;

      return (
        startCheck &&
        endCheck &&
        (!updatedFilters.category || item.category === updatedFilters.category) &&
        (!updatedFilters.financialYear || item.fy === updatedFilters.financialYear) &&

        (!updatedFilters.taxYear || item.taxYear === updatedFilters.taxYear) &&
        (!updatedFilters.taxType || item.taxType === updatedFilters.taxType) &&
        (!updatedFilters.taxAuthority || item.taxAuthority === updatedFilters.taxAuthority) &&

        (!updatedFilters.entity || item.entity === updatedFilters.entity)
      );
    });

    setFilteredData(filtered);
  };

  return (

    <>
      <div className={styles.filtersRow}>
        {/* Date Range */}
        {/* <input
          type="date"
          value={filters.dateStart}
          onChange={(e) => handleFilterChange("dateStart", e.target.value)}
          className={styles.filterInput}
        /> */}
        {/* <input
    type="date"
    value={filters.dateEnd}
    onChange={(e) => handleFilterChange("dateEnd", e.target.value)}
    className={styles.filterInput}
  /> */}
 <Dropdown
          label="Entity"
          placeholder="Select Entity"
          options={lovOptions["Entity"] || []}
          selectedKey={filters.financialYear || null}
          onChange={(_, option) => handleFilterChange("entity", option?.key as string)}
          styles={{ root: { minWidth: 160 } }}
        />

        <Dropdown
          label="Tax Type"
          placeholder="Select Tax Type"
          options={lovOptions["Tax Matter"] || []}
          selectedKey={filters.financialYear || null}
          onChange={(_, option) => handleFilterChange("taxType", option?.key as string)}
          styles={{ root: { minWidth: 160 } }}
        />
        <Dropdown
          label="Tax Authority"
          placeholder="Select Tax Authority"
          options={lovOptions["TaxAuthority"] || []}
          selectedKey={filters.financialYear || null}
          onChange={(_, option) => handleFilterChange("taxAuthority", option?.key as string)}
          styles={{ root: { minWidth: 160 } }}
        />
       


        <Dropdown
          label="Tax Year"
          placeholder="Select Tax Year"
          options={lovOptions["Tax Year"] || []}
          selectedKey={filters.taxYear || null}
          onChange={(_, option) => handleFilterChange("taxYear", option?.key as string)}
          styles={{ root: { minWidth: 160 } }}
        />

        <Dropdown
          label="Financial Year"
          placeholder="Select Financial Year"
          options={lovOptions["Financial Year"] || []}
          selectedKey={filters.financialYear || null}
          onChange={(_, option) => handleFilterChange("financialYear", option?.key as string)}
          styles={{ root: { minWidth: 160 } }}
        />
        <Dropdown
          label="Category"
          placeholder="Select Category"
          options={lovOptions["Category"] || []}
          selectedKey={filters.category || null}
          onChange={(_, option) => handleFilterChange("category", option?.key as string)}
          styles={{ root: { minWidth: 160 } }}
        />

 <div className={styles.buttonGroup}>
    <button className={styles.exportButton} >
      Export Report
    </button>
    <button className={styles.refreshButton} >
      ⟳
    </button>
  </div>
      </div>


      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Case No.</th>
              <th>Doc Reference No.</th>
              <th>Correspondance Type</th>
              <th>Attachments</th>
              <th>Date Received</th>
              <th>Financial Year</th>
              <th>Date of Compliance</th>
              <th>Lawyer Assigned</th>
              <th>Gross Tax Demanded/Exposure</th>
              <th>Case Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx}>
                <td>{item.caseNo}</td>
                <td>{item.docRef}</td>
                <td>{item.type}</td>
                <td>{item.attachment}</td>
                <td>{item.dateReceived}</td>
                <td>{item.fy}</td>
                <td>{item.complianceDate}</td>
                <td>{item.lawyer}</td>
                <td>{item.amount}</td>
                <td>
                  <span
                    className={
                      item.status === "Active"
                        ? styles.statusActive
                        : styles.statusInactive
                    }
                  >
                    {item.status}
                  </span>
                </td>
                <td>

                  <Button
                    variant="outline-warning"
                    size="sm" onClick={() => handleShow(item)}
                  >
                    👁                </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedCase && (
          <CorrespondenceDetailOffCanvas
            show={show}
            handleClose={() => setShow(false)}
            caseData={selectedCase}
          />
        )}
      </div>
    </>
  );
};

export default ReportsTable;
