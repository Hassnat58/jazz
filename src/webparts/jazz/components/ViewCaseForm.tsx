/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ViewCaseOffcanvas: React.FC<{
  show: boolean;
  onClose: () => void;
  caseData: any;
  attachments: any;
  SpfxContext: any;
}> = ({ show, onClose, caseData: data, attachments, SpfxContext }) => {
  if (!data) return null;
  const [taxIssueEntries, setTaxIssueEntries] = React.useState<any[]>([]);
  const [caseHistory, setCaseHistory] = React.useState<any[]>([]);
  const [historyTaxIssues, setHistoryTaxIssues] = React.useState<any>({});
  const [historyAttachments, setHistoryAttachments] = React.useState<any>({});

  const sp = spfi().using(SPFx(SpfxContext));

  React.useEffect(() => {
    const fetchTaxIssues = async () => {
      try {
        if (!data?.Id) return;

        const taxItems = await sp.web.lists
          .getByTitle("Tax Issues")
          .items.filter(`CaseId eq ${data.Id}`)
          .orderBy("ID", true)(); // ensure same order as image (ascending)

        const entries = taxItems.map((item: any) => ({
          id: item.Id,
          taxIssue: item.Title, // Issue name
          amountContested: item.AmountContested,
          rate: item.Rate,
          grossTaxExposure: item.GrossTaxExposure,
        }));

        setTaxIssueEntries(entries);
      } catch (error) {
        console.error("Error fetching Tax Issues:", error);
      }
    };

    fetchTaxIssues();
  }, [data?.Id]);

  // const getFormattedCaseNumber = (
  //   taxType: string,
  //   taxAuthority: string,
  //   parentCaseId: number
  // ) => {
  //   let prefix = "CN"; // default
  //   if (taxType === "Income Tax") prefix = "IT";
  //   else if (taxType === "Sales Tax") prefix = "ST";

  //   // add tax authority if present
  //   const authority = taxAuthority ? `-${taxAuthority}` : "";

  //   return `${prefix}-${authority}-${parentCaseId}`;
  // };

  React.useEffect(() => {
    const loadHistory = async () => {
      if (!data?.Title) return;

      try {
        const list = sp.web.lists.getByTitle("Cases");

        // Load items with same Title (newest → oldest)
        const sameTitleItems = await list.items
          .filter(
            `
    Title eq '${data.Title.replace(/'/g, "''")}'
    and (ApprovalStatus eq 'Approved' or ApprovalStatus eq 'Rejected')
  `,
          )
          .select("*", "Author/Title", "Editor/Title")
          .expand("Author", "Editor")
          .orderBy("ID", false)();

        // Only older versions
        const previousVersions = sameTitleItems.filter((i) => i.Id < data.Id);
        setCaseHistory(previousVersions);

        //----------------------------------------
        // LOAD TAX ISSUES (Per Version)
        //----------------------------------------
        const taxIssueMap: any = {};

        for (const version of previousVersions) {
          const issues = await sp.web.lists
            .getByTitle("Tax Issues")
            .items.filter(`CaseId eq ${version.Id}`)();

          taxIssueMap[version.Id] = issues;
        }

        setHistoryTaxIssues(taxIssueMap);

        //----------------------------------------
        // LOAD ATTACHMENTS (Per Version)
        //----------------------------------------
        const attachmentMap: any = {};

        for (const version of previousVersions) {
          const files = await sp.web.lists
            .getByTitle("Core Data Repositories")
            .items.filter(`CaseId eq ${version.Id}`)
            .select("File/Name", "File/ServerRelativeUrl", "ID")
            .expand("File")();

          attachmentMap[version.Id] = files.map((f: any) => ({
            FileName: f.File?.Name,
            Url: f.File?.ServerRelativeUrl,
            Id: f.Id,
          }));
        }

        setHistoryAttachments(attachmentMap);
      } catch (err) {
        console.error("Error loading history:", err);
      }
    };

    loadHistory();
  }, [data]);

  // const formattedCaseNumber = getFormattedCaseNumber(
  //   data.TaxType,
  //   data.TaxAuthority,
  //   data.ParentCaseId
  // );

  const generatePDF = async () => {
    const element = document.getElementById("pdf-container");
    if (!element) return;

    // Hide elements with "no-print" class
    const noPrintElements = element.querySelectorAll(
      ".no-print",
    ) as NodeListOf<HTMLElement>;
    noPrintElements.forEach((el) => (el.style.display = "none"));

    // Capture PDF (lower scale for smaller canvas)
    const canvas = await html2canvas(element, {
      scale: 1.5, // lower scale reduces file size
      useCORS: true,
      scrollY: 0,
      logging: false,
    });

    // Restore visibility
    noPrintElements.forEach((el) => (el.style.display = "block"));

    const imgData = canvas.toDataURL("image/jpeg", 0.8); // use JPEG with 0.8 quality

    // A4 size in mm
    const pdfWidth = 210;
    const pdfHeight = 297;

    // Fit content in single page
    const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;

    const pdf = new jsPDF("p", "mm", "a4");
    const x = (pdfWidth - imgWidth) / 2; // center horizontally
    const y = (pdfHeight - imgHeight) / 2; // center vertically

    pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);
    pdf.save(`Case-${data?.Title}.pdf`);
  };
  const getStatusClass = (status?: string) => {
    switch (status) {
      case "Approved":
        return styles.approved;
      case "Rejected":
        return styles.rejected;
      case "Pending":
        return styles.pending;
      case "Draft":
        return styles.draft;
      default:
        return styles.default;
    }
  };

  return (
    <div id="pdf-container">
      <div className={styles.viewCaseContainer}>
        <div className={styles.header}>
          <img src={jazzLogo} alt="Jazz Logo" className={styles.logo} />
          <h4>Litigation Case Details</h4>
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
              <td>{data.Title}</td>
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
                <strong>Notice/Order Type:</strong>
              </td>
              <td>{data.CorrespondenceType}</td>
              <td>
                <strong>Tax Type:</strong>
              </td>
              <td>{data.TaxType}</td>
              <td>
                <strong>Tax Consultant:</strong>
              </td>
              <td>{data.TaxConsultantAssigned}</td>
            </tr>

            <tr>
              <td>
                <strong>Date of Document:</strong>
              </td>
              <td>
                {data.Dateofdocument
                  ? new Date(data.Dateofdocument).toLocaleDateString()
                  : "-"}
              </td>
              <td>
                <strong>Date Received:</strong>
              </td>
              <td>
                {data.DateReceived
                  ? new Date(data.DateReceived).toLocaleDateString()
                  : "-"}
              </td>
              <td>
                <strong>Financial Year:</strong>
              </td>
              <td>{data.FinancialYear}</td>
            </tr>

            <tr>
              <td>
                <strong>Date of Compliance:</strong>
              </td>
              <td>
                {data.DateofCompliance
                  ? new Date(data.DateofCompliance).toLocaleDateString()
                  : "-"}
              </td>
              <td>
                <strong>Lawyer Assigned:</strong>
              </td>
              <td>{data.LawyerAssigned0}</td>
              <td>
                <strong>Gross Exposure:</strong>
              </td>
              <td>{data.GrossExposure}</td>
            </tr>

            <tr>
              <td>
                <strong>Hearing Date:</strong>
              </td>
              <td>{new Date(data.Hearingdate).toLocaleDateString()}</td>
              <td>
                <strong>Pending Authority:</strong>
              </td>
              <td>{data.PendingAuthority}</td>
              <td>
                <strong>Email - Title:</strong>
              </td>
              <td>{data.Email}</td>
            </tr>

            <tr>
              <td>
                <strong>Tax Year:</strong>
              </td>
              <td>{data.TaxYear}</td>
              <td>
                <strong>Issued By:</strong>
              </td>
              <td>{data.IssuedBy}</td>
            </tr>
            <tr>
              <td>
                <strong>Brief Description:</strong>
              </td>
              <td colSpan={5}>{data.BriefDescription}</td>
            </tr>
          </tbody>
        </table>

        {taxIssueEntries.length > 0 && (
          <>
            <h5 className={styles.subHeading}>Tax Issues</h5>
            <table className={styles.taxIssueTable}>
              <thead>
                <tr>
                  <th>Issues Contested</th>
                  <th>Amount Contested</th>
                  <th>Rate</th>
                  <th>Gross Exposure</th>
                </tr>
              </thead>
              <tbody>
                {taxIssueEntries.map((issue, index) => (
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
                  </tr>
                ))}
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
              <tr>
                <td style={{ backgroundColor: "#d9d9d9", fontWeight: "bold" }}>
                  Approved by
                </td>
                <td>{data.ApprovedBy || "—"}</td>
                <td style={{ backgroundColor: "#d9d9d9", fontWeight: "bold" }}>
                  Approved on
                </td>
                <td>
                  {data.ApprovedDate
                    ? new Date(data.ApprovedDate).toLocaleDateString("en-US", {
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
        {caseHistory.length > 0 && (
          <div className={styles.historySection}>
            <h4>Previous Versions History</h4>

            {caseHistory.map((item) => (
              <div key={item.Id} className={styles.historyCard}>
                <h5>
                  Version ID: {item.Title}-{item.Id} — Modified:{" "}
                  {new Date(item.Modified).toLocaleString()} — Approval Status:{" "}
                  <span
                    className={`${styles.statusCapsule} ${getStatusClass(
                      item.ApprovalStatus,
                    )}`}
                  >
                    {item.ApprovalStatus}
                  </span>
                </h5>

                <table className={styles.detailTable}>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Case No:</strong>
                      </td>
                      <td>
                        {item.ParentCaseId
                          ? item.ParentCase?.Title
                          : item.Title}
                      </td>
                      <td>
                        <strong>Entity:</strong>
                      </td>
                      <td>{item.Entity}</td>
                      <td>
                        <strong>Tax Authority:</strong>
                      </td>
                      <td>{item.TaxAuthority}</td>
                    </tr>

                    <tr>
                      <td>
                        <strong>Notice/Order Type:</strong>
                      </td>
                      <td>{item.CorrespondenceType}</td>
                      <td>
                        <strong>Tax Type:</strong>
                      </td>
                      <td>{item.TaxType}</td>
                      <td>
                        <strong>Tax Consultant:</strong>
                      </td>
                      <td>{item.TaxConsultantAssigned}</td>
                    </tr>

                    <tr>
                      <td>
                        <strong>Date of Document:</strong>
                      </td>
                      <td>
                        {new Date(item.Dateofdocument).toLocaleDateString(
                          "en-US",
                        )}
                      </td>
                      <td>
                        <strong>Date Received:</strong>
                      </td>
                      <td>
                        {new Date(item.DateReceived).toUTCString().slice(0, 16)}
                      </td>

                      <td>
                        <strong>Financial Year:</strong>
                      </td>
                      <td>{item.FinancialYear}</td>
                    </tr>

                    <tr>
                      <td>
                        <strong>Date of Compliance:</strong>
                      </td>
                      <td>
                        {item.DateofCompliance
                          ? new Date(item.DateofCompliance).toLocaleDateString(
                              "",
                            )
                          : ""}
                      </td>
                      <td>
                        <strong>Lawyer Assigned:</strong>
                      </td>
                      <td>{item.LawyerAssigned0}</td>
                      <td>
                        <strong>Gross Exposure:</strong>
                      </td>
                      <td>{item.GrossExposure}</td>
                    </tr>

                    <tr>
                      <td>
                        <strong>Hearing Date:</strong>
                      </td>
                      <td>
                        {item.Hearingdate
                          ? new Date(item.Hearingdate).toLocaleDateString()
                          : ""}
                      </td>
                      <td>
                        <strong>Pending Authority:</strong>
                      </td>
                      <td>{item.PendingAuthority}</td>
                      <td>
                        <strong>Email - Title:</strong>
                      </td>
                      <td>{item.Email}</td>
                    </tr>

                    <tr>
                      <td>
                        <strong>Tax Year:</strong>
                      </td>
                      <td>{item.TaxYear}</td>
                      <td>
                        <strong>Issued By:</strong>
                      </td>
                      <td>{item.IssuedBy}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Brief Description:</strong>
                      </td>
                      <td colSpan={5}>{item.BriefDescription}</td>
                    </tr>
                  </tbody>
                </table>

                {/* TAX ISSUES SECTION */}
                <h6>Tax Issues</h6>
                {historyTaxIssues[item.Id]?.length > 0 ? (
                  <table className={styles.taxIssueTable}>
                    <thead>
                      <tr>
                        <th>Issue</th>
                        <th>Amount Contested</th>
                        <th>Rate</th>
                        <th>Gross Exposure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyTaxIssues[item.Id].map((issue: any) => (
                        <tr key={issue.Id}>
                          <td>{issue.Title}</td>
                          <td>{issue.AmountContested}</td>
                          <td>{issue.Rate}</td>
                          <td>{issue.GrossTaxExposure}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No Tax Issues.</p>
                )}

                <h6>Attachments</h6>
                <div className={styles.fileList}>
                  {historyAttachments[item.Id]?.length > 0 ? (
                    historyAttachments[item.Id].map((file: any) => {
                      const extension = file.FileName.split(".")
                        .pop()
                        ?.toLowerCase();
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
                      }

                      return (
                        <div className={styles.fileItem} key={file.Id}>
                          <img
                            src={iconPath}
                            alt={extension + " file"}
                            style={{
                              width: "24px",
                              height: "24px",
                              objectFit: "contain",
                            }}
                          />
                          <span>{file.FileName}</span>

                          <a
                            href={file.Url}
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
                    <p>No attachments.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        {/* Download PDF */}
        <button
          onClick={generatePDF}
          className={styles.pdfButton + " no-print"}
        >
          Download PDF
        </button>

        {/* Print */}
        <button
          onClick={() => window.print()}
          className="no-print"
          style={{
            backgroundColor: "#ffd700",
            color: "black",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Print
        </button>

        {/* Share */}
        {/* <button
          onClick={() => {
            const subject = `Case Details: ${data?.Title}`;
            const body = `Please find the case details: ${window.location.href}`;
            window.location.href = `mailto:?subject=${encodeURIComponent(
              subject
            )}&body=${encodeURIComponent(body)}`;
          }}
          className="no-print"
          style={{
            backgroundColor: "#ffd700",
            color: "black",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Share
        </button> */}
      </div>
    </div>
  );
};

export default ViewCaseOffcanvas;
