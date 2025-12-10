/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/self-closing-comp */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import styles from "../components/ViewCaseFor.module.scss";
import jazzLogo from "../../jazz/assets/jazz-logo.png";
import pdfIcon from "../../jazz/assets/pdf.png";
import wordIcon from "../../jazz/assets/word.png";
import xlsIcon from "../../jazz/assets/xls.png";
import imageIcon from "../../jazz/assets/image.png";
import genericIcon from "../../jazz/assets/document.png"; // fallback
import { spfi, SPFx } from "@pnp/sp";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
const ViewUTPForm: React.FC<{
  show: boolean;
  onClose: () => void;
  utpData: any;
  attachments: any;
  SpfxContext: any;
}> = ({ show, onClose, utpData: data, attachments, SpfxContext }) => {
  if (!data) return null;
  const [utpTaxIssueEntries, setUtpTaxIssueEntries] = React.useState<any[]>([]);
  const [cashflowExposure, setCashflowExposure] = React.useState<number>(0);
  const [utpHistory, setUtpHistory] = React.useState<any[]>([]);
  const [historyUtpIssues, setHistoryUtpIssues] = React.useState<any>({});
  const [historyUtpAttachments, setHistoryUtpAttachments] = React.useState<any>(
    {}
  );

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
            "EBITDA",
            "ProvisionGLCode",
            "PaymentGLCode",
            "UTPCategory",
            "ERMCategory",
            "GRSCode"
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
          grscode: item.GRSCode,
          provisionGlCode: item.ProvisionGLCode,
          paymentGlCode: item.PaymentGLCode,
          UTPCategory: item.UTPCategory,
          ERMCategory: item.ERMCategory,
        }));
        const totalUnderProtest = mappedIssues
          .filter(
            (i) => i.paymentType?.toLowerCase() === "payment under protest"
          )
          .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const calculatedCashflowExposure =
          (Number(data.GrossExposure) || 0) - totalUnderProtest;
        setUtpTaxIssueEntries(mappedIssues);
        setCashflowExposure(calculatedCashflowExposure);
        setUtpTaxIssueEntries(mappedIssues);
      } catch (error) {
        console.error("Error fetching UTP Tax Issues:", error);
      }
    };

    fetchUtpTaxIssues();
  }, [data?.Id]);

  React.useEffect(() => {
    const loadHistory = async () => {
      if (!data?.UTPId) return;

      try {
        const list = sp.web.lists.getByTitle("UTPData");

        // Load all versions for the same UTP
        const versions = await list.items
          .filter(`UTPId eq '${data.UTPId}'`)
          .select("*", "Author/Title", "Editor/Title")
          .expand("Author", "Editor")
          .orderBy("ID", false)();

        // Only previous versions (smaller IDs)
        const previousVersions = versions.filter((i) => i.Id < data.Id);
        setUtpHistory(previousVersions);

        //------------------------------
        // LOAD UTP ISSUES (Per Version)
        //------------------------------
        const utpIssueMap: any = {};
        for (const version of previousVersions) {
          const issues = await sp.web.lists
            .getByTitle("UTP Tax Issue")
            .items.filter(`UTPId eq ${version.Id}`)();

          utpIssueMap[version.Id] = issues;
        }
        setHistoryUtpIssues(utpIssueMap);

        //------------------------------
        // LOAD ATTACHMENTS (Per Version)
        //------------------------------

        const attachmentMap: any = {};

        for (const version of previousVersions) {
          const files = await sp.web.lists
            .getByTitle("Core Data Repositories")
            .items.filter(`UTPId eq ${version.Id}`)
            .select("File/Name", "File/ServerRelativeUrl", "ID")
            .expand("File")();

          attachmentMap[version.Id] = files.map((f: any) => ({
            FileName: f.File?.Name,
            Url: f.File?.ServerRelativeUrl,
            Id: f.Id,
          }));
        }

        setHistoryUtpAttachments(attachmentMap);
      } catch (err) {
        console.error("Error loading UTP history:", err);
      }
    };

    loadHistory();
  }, [data]);

  // const generatePDF = async () => {
  //   const element = document.getElementById("pdf-container");
  //   if (!element) return;

  //   const canvas = await html2canvas(element, {
  //     scale: 2,
  //     scrollY: -window.scrollY,
  //   });

  //   const imgData = canvas.toDataURL("image/jpeg", 0.98);
  //   const pdf = new jsPDF("p", "mm", "a4");

  //   const pageWidth = pdf.internal.pageSize.getWidth();
  //   const pageHeight = pdf.internal.pageSize.getHeight();

  //   const imgWidth = pageWidth;
  //   const imgHeight = (canvas.height * imgWidth) / canvas.width;

  //   let heightLeft = imgHeight;
  //   let position = 0;

  //   pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  //   heightLeft -= pageHeight;

  //   while (heightLeft > 0) {
  //     pdf.addPage();
  //     position = -imgHeight + heightLeft;

  //     pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);

  //     heightLeft -= pageHeight;
  //   }

  //   pdf.save(`Case-${data?.UTPId}.pdf`);
  // };

  return (
    // <div id="pdf-container">
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
            {/* <td>
              <strong>ERM Unique No:</strong>
            </td>
            <td>{data.ERMUniqueNumbering}</td> */}
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
            <td>
              {data.GrossExposure.toLocaleString("en-US", {
                style: "decimal",
              })}
            </td>
            <td>
              <strong>EBITDA Exposure Exist:</strong>
            </td>
            <td>{data.EBITDAExposureExists ? "Yes" : "No"}</td>
            <td>
              <strong>Cashflow Exposure:</strong>
            </td>
            <td colSpan={5}>
              {cashflowExposure
                ? cashflowExposure.toLocaleString("en-US", {
                    style: "decimal",
                  })
                : "—"}
            </td>
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
                <th>GRS Code</th>
                <th>Payment GL Code</th>
                <th>Provision GL Code</th>
                <th>UTP Category</th>
                <th>ERM Category</th>
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
                  <td style={{ textAlign: "center" }}>
                    {issue.grscode || "-"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {issue.paymentGlCode || "-"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {issue.provisionGlCode || "-"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {issue.UTPCategory || "-"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {issue.ERMCategory || "-"}
                  </td>
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

      {utpHistory.length > 0 && (
        <div className={styles.historySection}>
          <h4>UTP Previous Versions History</h4>

          {utpHistory.map((item) => (
            <div key={item.Id} className={styles.historyCard}>
              <h5>
                Version ID: {item.UTPId}-{item.Id} — Modified:{" "}
                {new Date(item.Modified).toLocaleString()}
              </h5>

              <table className={styles.detailTable}>
                <tbody>
                  <tr>
                    <td>
                      <strong>UTP ID:</strong>
                    </td>
                    <td>{item.UTPId}</td>
                    <td>
                      <strong>Entity:</strong>
                    </td>
                    <td>{item.CaseNumber?.Entity}</td>
                    <td>
                      <strong>Pending Authority:</strong>
                    </td>
                    <td>{item.CaseNumber?.PendingAuthority}</td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Tax Type:</strong>
                    </td>
                    <td>{item.TaxType}</td>
                    <td>
                      <strong>Tax Year:</strong>
                    </td>
                    <td>{item.CaseNumber?.TaxYear}</td>
                    <td>
                      <strong>UTP Category:</strong>
                    </td>
                    <td>{item.UTPCategory}</td>
                  </tr>

                  <tr>
                    <td>
                      <strong>GRS Code:</strong>
                    </td>
                    <td>{item.GRSCode}</td>
                    <td>
                      <strong>UTP Date:</strong>
                    </td>
                    <td>
                      {item.UTPDate
                        ? new Date(item.UTPDate).toLocaleDateString()
                        : ""}
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Gross Exposure:</strong>
                    </td>
                    <td>{item.GrossExposure}</td>
                    <td>
                      <strong>EBITDA Exposure Exist:</strong>
                    </td>
                    <td>{item.EBITDAExposureExists ? "Yes" : "No"}</td>
                  </tr>
                </tbody>
              </table>

              {/* UTP Issues */}
              <h6>UTP Tax Issues</h6>
              {historyUtpIssues[item.Id]?.length > 0 ? (
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
                      <th>GRS Code</th>
                      <th>Payment GL Code</th>
                      <th>Provision GL Code</th>
                      <th>UTP Category</th>
                      <th>ERM Category</th>
                    </tr>
                  </thead>

                  <tbody>
                    {historyUtpIssues[item.Id].map((issue: any) => (
                      <tr key={issue.Id}>
                        <td>{issue.TaxIssue || issue.Title || "-"}</td>
                        <td style={{ textAlign: "right" }}>
                          {issue.AmountContested
                            ? Number(issue.AmountContested).toLocaleString()
                            : "-"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {issue.Rate
                            ? `${Number(issue.Rate).toFixed(2)}%`
                            : "-"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {issue.GrossTaxExposure
                            ? Number(issue.GrossTaxExposure).toLocaleString()
                            : "-"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {issue.RiskCategory || "-"}
                        </td>
                        <td>{issue.ContigencyNote || "-"}</td>
                        <td style={{ textAlign: "center" }}>
                          {issue.PaymentType || "-"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {issue.Amount
                            ? Number(issue.Amount).toLocaleString()
                            : "-"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {issue.EBITDA || "-"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {issue.GRSCode || "-"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {issue.PaymentGlCode || "-"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {issue.ProvisionGlCode || "-"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {issue.UTPCategory || "-"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {issue.ERMCategory || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No UTP Tax Issues.</p>
              )}

              {/* ATTACHMENTS */}
              <h6>Attachments</h6>
              <div className={styles.fileList}>
                {historyUtpAttachments[item.Id]?.length > 0 ? (
                  historyUtpAttachments[item.Id].map((file: any) => {
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

                    // Handle size only if backend sends Size
                    const size = file.Size
                      ? file.Size > 1024 * 1024
                        ? (file.Size / (1024 * 1024)).toFixed(2) + " MB"
                        : (file.Size / 1024).toFixed(2) + " KB"
                      : null;

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
                        {size && <span>{size}</span>}
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
      {/* </div> */}
      {/* <button
        onClick={generatePDF}
        style={{
          backgroundColor: "#FFD700",
          color: "black",
          padding: "10px 20px",
          border: "none",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Download PDF
      </button> */}
    </div>
  );
};

export default ViewUTPForm;
