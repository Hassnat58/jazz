/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Offcanvas, Button } from "react-bootstrap";
import styles from "./Reports.module.scss";
import jazzLogo from "../assets/jazz-logo.png";

interface Props {
  show: boolean;
  handleClose: () => void;
  caseData: any;
}

const ReportsOffCanvas: React.FC<Props> = ({ show, handleClose, caseData }) => {
  return (
    <Offcanvas
      show={show}
      onHide={handleClose}
      placement="end"
      backdrop
      scroll
      className={styles.canvasWrapper}
    >
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <strong>{caseData.docRef}</strong>
          <span className={styles.statusActive}>Active</span>
        </div>
        <div className="d-flex gap-2">
          <Button variant="warning" size="sm">
            📄 Download PDF
          </Button>
          <Button variant="light" size="sm" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
      <Offcanvas.Body>
        <div className={styles.jazzLogo}>
          <img src={jazzLogo} alt="Jazz Logo" height={50} />
        </div>
        <h5 className="text-center fw-bold mt-2">Coorespondance In Details</h5>

        <div className={`${styles.metaRow}`}>
          <div>
            <strong>Category</strong>
            <br />
            Tax Provision
          </div>
          <div>
            <strong>Last Updated</strong>
            <br />
            07-14-2025
          </div>
          <div>
            <strong>Owner</strong>
            <br />
            John Doe
          </div>
        </div>

        <table className={`table table-bordered ${styles.detailTable}`}>
          <tbody>
            <tr>
              <td>
                <strong>Case No:</strong>
              </td>
              <td>{caseData.caseNo}</td>
              <td>
                <strong>Doc Reference No:</strong>
              </td>
              <td>{caseData.docRef}</td>
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
              <td>{caseData.type}</td>
            </tr>
            <tr>
              <td>
                <strong>Brief Description:</strong>
              </td>
              <td>Financial records require verification.</td>
            </tr>
            <tr>
              <td>
                <strong>Issued By:</strong>
              </td>
              <td>IRS Audit Dept</td>
              <td>
                <strong>Attachments:</strong>
              </td>
              <td>{caseData.attachment}</td>
            </tr>
            <tr>
              <td>
                <strong>Case Brief Description:</strong>
              </td>
              <td colSpan={3}>
                The audit uncovered discrepancies in reported income and
                expenses.
              </td>
            </tr>
            <tr>
              <td>
                <strong>Date of Document:</strong>
              </td>
              <td>03-15-2025</td>
              <td>
                <strong>Date Received:</strong>
              </td>
              <td>{caseData.dateReceived}</td>
            </tr>
            <tr>
              <td>
                <strong>Financial Year:</strong>
              </td>
              <td>{caseData.fy}</td>
              <td>
                <strong>Date of Compliance:</strong>
              </td>
              <td>{caseData.complianceDate}</td>
            </tr>
            <tr>
              <td>
                <strong>Tax Consultant Assigned:</strong>
              </td>
              <td>John Doe</td>
              <td>
                <strong>Lawyer Assigned:</strong>
              </td>
              <td>{caseData.lawyer}</td>
            </tr>
            <tr>
              <td>
                <strong>Gross Tax Demanded:</strong>
              </td>
              <td>{caseData.amount}</td>
              <td>
                <strong>Email - Title:</strong>
              </td>
              <td>{caseData.type}</td>
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
                <strong>Tax exposure Stage:</strong>
              </td>
              <td>Assessment</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-3">
          <strong>Attachments:</strong>
          <div className="d-flex flex-wrap gap-3 mt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.attachmentItem}>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
                  width={24}
                  alt="doc"
                />
                <span>file_example.doc</span>
                <span>5.7MB</span>
              </div>
            ))}
          </div>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default ReportsOffCanvas;
