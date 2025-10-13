/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import styles from "../components/ViewCaseFor.module.scss";
import jazzLogo from "../assets/jazz-logo.png";
import pdfIcon from "../assets/pdf.png";
import wordIcon from "../assets/word.png";
import xlsIcon from "../assets/xls.png";
import imageIcon from "../assets/image.png";
import genericIcon from "../assets/document.png"; // fallback

const ViewCorrespondenceOutOffcanvas: React.FC<{
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
        <h4>Correspondence Out Details</h4>
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
              <strong>Correspondence Out:</strong>
            </td>
            <td>{data.CorrespondenceOut}</td>
            <td>
              <strong>Case Number:</strong>
            </td>
            <td>
              {(() => {
                if (!data.CaseNumber) return "";
                let prefix = "CN";
                if (data.CaseNumber.TaxType === "Income Tax") prefix = "IT";
                if (data.CaseNumber.TaxType === "Sales Tax") prefix = "ST";
                const taxAuth = data.CaseNumber.TaxAuthority || "N/A";
                return `${prefix}-${taxAuth}-${data.CaseNumber?.Id}`;
              })()}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Filed Through:</strong>
            </td>
            <td>{data.Filedthrough}</td>
            <td>
              <strong>Filed At:</strong>
            </td>
            <td>{data.FiledAt}</td>
          </tr>
          <tr>
            <td>
              <strong>Date of Filing:</strong>
            </td>
            <td>{data.Dateoffiling?.split("T")[0]}</td>
            <td>
              <strong>Entity</strong>
            </td>
            <td>{data.CaseNumber?.Entity}</td>
          </tr>
          <tr>
            <td>
              <strong>Tax Authority</strong>
            </td>
            <td>{data.CaseNumber?.TaxAuthority}</td>
            <td>
              <strong>Tax Type</strong>
            </td>
            <td>{data.CaseNumber?.TaxType}</td>
          </tr>
          <tr>
            <td>
              <strong>Tax Year :</strong>
            </td>
            <td>{data.CaseNumber?.TaxYear}</td>
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
      <div className={styles.approvalSection}>
        <table className={styles.detailTable}>
          <tbody>
            <tr>
              <td style={{ backgroundColor: "#d9d9d9", fontWeight: "bold" }}>
                Entered by
              </td>
              <td>{data.Author?.Title || "—"}</td>
              <td style={{ backgroundColor: "#d9d9d9", fontWeight: "bold" }}>
                Created on
              </td>
              <td>
                {data.Created
                  ? new Date(data.Created).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewCorrespondenceOutOffcanvas;
