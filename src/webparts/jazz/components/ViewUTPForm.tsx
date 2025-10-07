/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/self-closing-comp */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import styles from "../components/ViewCaseFor.module.scss";
import jazzLogo from "../assets/jazz-logo.png";
import pdfIcon from "../assets/pdf.png";
import wordIcon from "../assets/word.png";
import xlsIcon from "../assets/xls.png";
import imageIcon from "../assets/image.png";
import genericIcon from "../assets/document.png"; // fallback
import { spfi, SPFx } from "@pnp/sp";
const ViewUTPForm: React.FC<{
  show: boolean;
  onClose: () => void;
  utpData: any;
  attachments: any;
  SpfxContext: any;
}> = ({ show, onClose, utpData: data, attachments, SpfxContext }) => {
  if (!data) return null;
  const [utpTaxIssueEntries, setUtpTaxIssueEntries] = React.useState<any[]>([]);

  const sp = spfi().using(SPFx(SpfxContext));

  React.useEffect(() => {
    const fetchUtpTaxIssues = async () => {
      try {
        if (!data?.Id) return;

        const issues = await sp.web.lists
          .getByTitle("UTP Tax Issue")
          .items.filter(`UTPId eq ${data?.Id}`)
          .select(
            "Id",
            "Title",
            "RiskCategory",
            "GrossTaxExposure",
            "AmountContested",
            "ContigencyNote",
            "Rate",
            "PaymentType",
            "Amount",
            "EBITDA"
          )
          .orderBy("ID", true)();

        const mappedIssues = issues.map((item) => ({
          id: item.Id,
          taxIssue: item.Title,
          riskCategory: item.RiskCategory,
          contigencyNote: item.ContigencyNote,
          rate: item.Rate,
          amountContested: item.AmountContested,
          grossTaxExposure: item.GrossTaxExposure,
          paymentType: item.PaymentType,
          amount: item.Amount,
          ebitda: item.EBITDA,
        }));

        setUtpTaxIssueEntries(mappedIssues);
      } catch (error) {
        console.error("Error fetching UTP Tax Issues:", error);
      }
    };

    fetchUtpTaxIssues();
  }, [data?.Id]);

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
              <strong>Entity:</strong>
            </td>
            <td>{data.CaseNumber?.Entity}</td>
            <td>
              <strong>Pending Authority:</strong>
            </td>
            <td>{data.CaseNumber?.PendingAuthority}</td>
          </tr>

          <tr>
            <td>
              <strong>Tax Type:</strong>
            </td>
            <td>{data.TaxType}</td>
            <td>
              <strong>Tax Year:</strong>
            </td>
            <td>{data.CaseNumber?.TaxYear}</td>
            <td>
              <strong>UTP Category:</strong>
            </td>
            <td>{data.UTPCategory}</td>
          </tr>

          <tr>
            <td>
              <strong>GRS Code:</strong>
            </td>
            <td>{data.GRSCode}</td>
            <td>
              <strong>ERM Unique No:</strong>
            </td>
            <td>{data.ERMUniqueNumbering}</td>
            <td>
              <strong>UTP Date:</strong>
            </td>
            <td>
              {data.UTPDate ? new Date(data.UTPDate).toLocaleDateString() : ""}
            </td>
          </tr>

          <tr>
            <td>
              <strong>Gross Exposure:</strong>
            </td>
            <td>{data.GrossExposure}</td>
            <td>
              <strong>EBITDA Exposure Exist:</strong>
            </td>
            <td>{data.EBITDAExposureExists ? "Yes" : "No"}</td>
          </tr>

          <tr>
            <td>
              <strong>Payment GL Code:</strong>
            </td>
            <td>{data.PaymentGLCode}</td>
            <td>
              <strong>Provision GL Code:</strong>
            </td>
            <td>{data.ProvisionGLCode}</td>
            <td>
              <strong>ERM Category:</strong>
            </td>
            <td>{data.ERMCategory}</td>
          </tr>
        </tbody>
      </table>

      {utpTaxIssueEntries.length > 0 && (
        <>
          <h5 className={styles.subHeading}>UTP Tax Issues</h5>
          <table className={styles.taxIssueTable}>
            <thead>
              <tr>
                <th>Issue Contested</th>
                <th>Amount Contested</th>
                <th>Rate</th>
                <th>Gross Exposure</th>
                <th>Risk Category</th>
                <th>Contingency Note</th>
                <th>Payment Type</th>
                <th>Amount</th>
                <th>EBITDA</th>
              </tr>
            </thead>
            <tbody>
              {utpTaxIssueEntries.map((issue, index) => (
                <tr key={index}>
                  <td>{issue.taxIssue}</td>
                  <td style={{ textAlign: "right" }}>
                    {issue.amountContested
                      ? Number(issue.amountContested).toLocaleString()
                      : "-"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {issue.rate ? `${Number(issue.rate).toFixed(2)}%` : "-"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {issue.grossTaxExposure
                      ? Number(issue.grossTaxExposure).toLocaleString()
                      : "-"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {issue.riskCategory || "-"}
                  </td>
                  <td>{issue.contigencyNote || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    {issue.paymentType || "-"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {issue.amount ? Number(issue.amount).toLocaleString() : "-"}
                  </td>
                  <td style={{ textAlign: "right" }}>{issue.ebitda || "-"}</td>
                </tr>
              ))}

              {/* Optional: total row */}
              {/* <tr>
                <td
                  colSpan={3}
                  style={{ textAlign: "right", fontWeight: "600" }}
                >
                  Total
                </td>
                <td style={{ textAlign: "right", fontWeight: "600" }}>
                  {utpTaxIssueEntries
                    .reduce(
                      (sum, item) => sum + (Number(item.grossTaxExposure) || 0),
                      0
                    )
                    .toLocaleString()}
                </td>
                <td colSpan={2}></td>
              </tr> */}
            </tbody>
          </table>
        </>
      )}

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
