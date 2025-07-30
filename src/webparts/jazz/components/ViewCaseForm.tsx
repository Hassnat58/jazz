/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import styles from "../components/ViewCaseFor.module.scss";
import jazzLogo from "../assets/jazz-logo (1).png";

const ViewCaseOffcanvas: React.FC<{
  show: boolean;
  onClose: () => void;
  caseData: any;
}> = ({ show, onClose, caseData: data }) => {
  if (!data) return null;

  return (
    <div className={styles.viewCaseContainer}>
      <div className={styles.header}>
        <img src={jazzLogo} alt="Jazz Logo" className={styles.logo} />
        <h4>Correspondence In Details</h4>
      </div>

      <div className={styles.metaInfo}>
        <div>Last Updated: 07-14-2025</div>
        <div>
          Owner: <strong>John Doe</strong>
        </div>
      </div>

      <table className={styles.detailTable}>
        <tbody>
          <tr>
            <td>
              <strong>Case No:</strong>
            </td>
            <td>00-CN{data.ID}</td>
            <td>
              <strong>Doc Reference No:</strong>
            </td>
            <td>{data.DocumentReferenceNo}</td>
          </tr>
          <tr>
            <td>
              <strong>Entity:</strong>
            </td>
            <td>Acme Corp</td>
            <td>
              <strong>Tax Authority:</strong>
            </td>
            <td>IRS</td>
          </tr>
          <tr>
            <td>
              <strong>Jurisdiction:</strong>
            </td>
            <td>Federal</td>
            <td>
              <strong>Concerning Law:</strong>
            </td>
            <td>Income Tax Act</td>
          </tr>
          <tr>
            <td>
              <strong>Correspondence Type:</strong>
            </td>
            <td>{data.CorrespondenceType}</td>
            <td>
              <strong>Attachments:</strong>
            </td>
            <td>audit_report.pdf.xlsx</td>
          </tr>
          <tr>
            <td>
              <strong>Brief Description:</strong>
            </td>
            <td colSpan={3}>Financial records require verification.</td>
          </tr>
          <tr>
            <td>
              <strong>Issued By:</strong>
            </td>
            <td>IRS Audit Dept</td>
            <td>
              <strong>Case Brief Description:</strong>
            </td>
            <td>
              The audit uncovered discrepancies in reported income and expenses.
            </td>
          </tr>
          <tr>
            <td>
              <strong>Date of Document:</strong>
            </td>
            <td>{data.DateReceived?.split("T")[0]}</td>
            <td>
              <strong>Date Received:</strong>
            </td>
            <td>{data.DateReceived?.split("T")[0]}</td>
          </tr>
          <tr>
            <td>
              <strong>Financial Year:</strong>
            </td>
            <td>{data.FinancialYear}</td>
            <td>
              <strong>Date of Compliance:</strong>
            </td>
            <td>{data.DateofCompliance?.split("T")[0]}</td>
          </tr>
          <tr>
            <td>
              <strong>Lawyer Assigned:</strong>
            </td>
            <td>{data.LawyerAssigned}</td>
            <td>
              <strong>Gross Tax Demanded:</strong>
            </td>
            <td>{data.GrossTaxDemanded}</td>
          </tr>
          <tr>
            <td>
              <strong>Hearing Date:</strong>
            </td>
            <td>03-15-2025</td>
            <td>
              <strong>Next Forum/Pending Authority:</strong>
            </td>
            <td>Tax Court</td>
          </tr>
          <tr>
            <td>
              <strong>Email - Title:</strong>
            </td>
            <td>Assessment Notice</td>
            <td>
              <strong>Tax exposure Stage:</strong>
            </td>
            <td>Assessment</td>
          </tr>
        </tbody>
      </table>

      <div className={styles.attachments}>
        <h6>Attachments:</h6>
        <div className={styles.fileList}>
          <div className={styles.fileItem}>
            <img src="/icons/doc-icon.png" alt="doc" />
            <span>file_example.doc</span>
            <span>5.7MB</span>
            <button className="btn btn-outline-secondary btn-sm">⬇</button>
          </div>
          {/* Add more files similarly */}
        </div>
      </div>
    </div>
  );
};

export default ViewCaseOffcanvas;
