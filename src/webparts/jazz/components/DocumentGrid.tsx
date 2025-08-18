/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useEffect, useState } from "react";
import { spfi, SPFx } from "@pnp/sp";
import styles from "./DocumentGrid.module.scss";
import pdfIcon from "../assets/pdf.png";
import wordIcon from "../assets/word.png";
import xlsIcon from "../assets/xls.png";
import defaultIcon from "../assets/document.png";
import imageIcon from "../assets/image.png";
import { Button } from "react-bootstrap";
// import { FiDownload } from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";
import { Download } from "react-bootstrap-icons";

interface Props {
  SpfxContext: any;
}

const DocumentGrid: React.FC<Props> = ({ SpfxContext }) => {
  const [documentFiles, setDocumentFiles] = useState<any[]>([]);
  const sp = spfi().using(SPFx(SpfxContext));

  useEffect(() => {
    loadDocumentFiles();
  }, []);

  const loadDocumentFiles = async () => {
    try {
      const items = await sp.web
        .getFolderByServerRelativePath("/sites/LMS/Core Data Repositories")
        .files.select(
          "Name",
          "Length",
          "ServerRelativeUrl",
          "TimeCreated",
          "TimeLastModified"
        )();
      setDocumentFiles(items);
    } catch (error) {
      console.error("Error fetching document files:", error);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf")) return pdfIcon;
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx"))
      return wordIcon;
    if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) return xlsIcon;
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) return imageIcon;
    //
    return defaultIcon;
  };

  const formatSize = (bytes: string) => {
    const mb = parseFloat(bytes) / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <div className={styles.documentGrid}>
      {documentFiles.map((file, index) => (
        <div key={index} className={styles.documentCard}>
          <img
            src={getFileIcon(file.Name)}
            alt="icon"
            className={styles.fileIcon}
          />
          <p className={styles.fileName}>{file.Name}</p>
          <p className={styles.fileSize}>{formatSize(file.Length)}</p>
          <div className={styles.actions}>
            <Button
              href={file.ServerRelativeUrl}
              target="_blank"
              rel="noreferrer"
              title="View"
              variant="outline-warning"
              size="sm"
            >
              👁
            </Button>
            <a
              href={file.ServerRelativeUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              title="Download"
              style={{ textDecoration: "none" }}
            >
              <Button variant="outline-danger" size="sm">
                <Download className="me-1" />
              </Button>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentGrid;
