/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import styles from "../components/ViewCaseFor.module.scss";
import jazzLogo from "../assets/jazz-logo.png";
import pdfIcon from "../assets/pdf.png";
import wordIcon from "../assets/word.png";
import xlsIcon from "../assets/xls.png";
import imageIcon from "../assets/image.png";
import genericIcon from "../assets/document.png"; // fallback

const ViewUTPForm: React.FC<{
  show: boolean;
  onClose: () => void;
  utpData: any;
  attachments: any;
}> = ({ show, onClose, utpData: data, attachments }) => {
  if (!data) return null;

  return (
    <div className={styles.viewCaseContainer}>
      <div className={styles.header}>
        <img src={jazzLogo} alt="Jazz Logo" className={styles.logo} />
        <h4>UTP Details</h4>
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
              <strong>UTP ID:</strong>
            </td>
            <td>{data.UTPId}</td>
            <td>
              <strong>GMLR ID:</strong>
            </td>
            <td>{data.GMLRID}</td>
          </tr>
          <tr>
            <td>
              <strong>GRS Code:</strong>
            </td>
            <td>{data.GRSCode}</td>
            <td>
              <strong>UTP Category:</strong>
            </td>
            <td>{data.UTPCategory}</td>
          </tr>
          <tr>
            <td>
              <strong>Gross Exposure:</strong>
            </td>
            <td>{data.GrossExposure}</td>
            <td>
              <strong>P&L Exposure:</strong>
            </td>
            <td>{data.PLExposure}</td>
          </tr>
          <tr>
            <td>
              <strong>Contingency Note Exists:</strong>
            </td>
            <td>
              {data.ContingencyNoteExists ? <span>Yes</span> : <span>No</span>}
            </td>
            <td>
              <strong>Risk Category:</strong>
            </td>
            <td>{data.RiskCategory}</td>
          </tr>
          <tr>
            <td>
              <strong>Tax type</strong>
            </td>
            <td>{data.TaxType}</td>
            <td>
              <strong>ERM Unique Numbering:</strong>
            </td>
            <td>{data.ERMUniqueNumbering}</td>
          </tr>
          <tr>
            <td>
              <strong>Payment Type:</strong>
            </td>
            <td>{data.PaymentType}</td>
            <td>
              <strong>EBITDA Exposure:</strong>
            </td>
            <td>{data.EBITDAExposure}</td>
          </tr>
          <tr>
            <td>
              <strong>UTP Date:</strong>
            </td>
            <td>{new Date(data.UTPDate).toLocaleDateString()}</td>
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

export default ViewUTPForm;
