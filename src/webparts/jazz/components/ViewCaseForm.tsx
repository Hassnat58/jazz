/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import styles from "../components/ViewCaseFor.module.scss";
import jazzLogo from "../assets/jazz-logo.png";
import pdfIcon from "../assets/pdf.png";
import wordIcon from "../assets/word.png";
import xlsIcon from "../assets/xls.png";
import imageIcon from "../assets/image.png";
import genericIcon from "../assets/document.png"; // fallback

const ViewCaseOffcanvas: React.FC<{
  show: boolean;
  onClose: () => void;
  caseData: any;
  attachments: any;
}> = ({ show, onClose, caseData: data, attachments }) => {
  if (!data) return null;

  return (
    <div className={styles.viewCaseContainer}>
      <div className={styles.header}>
        <img src={jazzLogo} alt="Jazz Logo" className={styles.logo} />
        <h4>Correspondence In Details</h4>
      </div>

      <div className={styles.metaInfo}>
        <div>Last Updated: {new Date(data.Modified).toLocaleString()}</div>
        <div>
          Owner: <strong>{data.Author?.Title}</strong>
        </div>
      </div>

      <table className={styles.detailTable}>
        <tbody>
          <tr>
            <td>
              <strong>Case No:</strong>
            </td>
            <td>00-CN{data.ID}</td>
          </tr>
          <tr>
            <td>
              <strong>Entity:</strong>
            </td>
            <td>{data.Entity}</td>
            <td>
              <strong>Tax Authority:</strong>
            </td>
            <td>{data.TaxAuthority}</td>
          </tr>
          <tr>
            <td>
              <strong>Jurisdiction:</strong>
            </td>
            <td>{data.Jurisdiction}</td>
            <td>
              <strong>Concerning Law:</strong>
            </td>
            <td>{data.ConcerningLaw}</td>
          </tr>
          <tr>
            <td>
              <strong>Correspondence Type:</strong>
            </td>
            <td>{data.CorrespondenceType}</td>
          </tr>
          <tr>
            <td>
              <strong>Brief Description:</strong>
            </td>
            <td colSpan={3}>{data.BriefDescription}</td>
          </tr>
          <tr>
            <td>
              <strong>Issued By:</strong>
            </td>
            <td>{data.IssuedBy}</td>
          </tr>
          <tr>
            <td>
              <strong>Case Brief Description:</strong>
            </td>
            <td colSpan={3}>{data.CaseBriefDescription}</td>
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
            <td>{data.LawyerAssigned?.Title}</td>
            <td>
              <strong>Gross Tax Demanded:</strong>
            </td>
            <td>{data.GrossTaxDemanded}</td>
          </tr>
          <tr>
            <td>
              <strong>Hearing Date:</strong>
            </td>
            <td>{data.Hearingdate?.split("T")[0]}</td>
            <td>
              <strong>Next Forum/Pending Authority:</strong>
            </td>
            <td>{data.NextForum_x002f_PendingAuthority}</td>
          </tr>
          <tr>
            <td>
              <strong>Email - Title:</strong>
            </td>
            <td>{data.Email}</td>
            <td>
              <strong>Tax exposure Stage:</strong>
            </td>
            <td>{data.TaxexposureStage}</td>
          </tr>
        </tbody>
      </table>

      <div className={styles.attachments}>
        <h6>Attachments:</h6>
        <div className={styles.fileList}>
          {attachments && attachments.length > 0 ? (
            attachments.map((file: any) => {
              const fileName = file?.File?.Name || "";
              const fileUrl = file?.File?.ServerRelativeUrl || "";
              const fileSizeBytes = file?.File?.Length || 0;
              const fileSize =
                fileSizeBytes > 1024 * 1024
                  ? (fileSizeBytes / (1024 * 1024)).toFixed(2) + " MB"
                  : (fileSizeBytes / 1024).toFixed(2) + " KB";

              const extension = fileName.split(".").pop()?.toLowerCase();
              let iconPath = genericIcon;
              switch (extension) {
                case "pdf":
                  iconPath = pdfIcon;
                  break;
                case "doc":
                case "docx":
                  iconPath = wordIcon;
                  break;
                case "xls":
                case "xlsx":
                  iconPath = xlsIcon;
                  break;
                case "png":
                case "jpg":
                case "jpeg":
                  iconPath = imageIcon;
                  break;
                default:
                  iconPath = genericIcon;
              }

              return (
                <div className={styles.fileItem} key={file.ID}>
                  <img
                    src={iconPath}
                    alt={extension + " file"}
                    style={{
                      width: "24px",
                      height: "24px",
                      objectFit: "contain",
                    }}
                  />
                  <span>{fileName}</span>
                  <span>{fileSize}</span>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-secondary btn-sm"
                    download
                  >
                    ⬇
                  </a>
                </div>
              );
            })
          ) : (
            <p>No attachments found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewCaseOffcanvas;
