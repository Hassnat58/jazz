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
import { Download } from "react-bootstrap-icons";
import { TextField, ComboBox } from "@fluentui/react";

// props
interface Props {
  SpfxContext: any;
}

const DocumentGrid: React.FC<Props> = ({ SpfxContext }) => {
  const [documentFiles, setDocumentFiles] = useState<any[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [utps, setUtps] = useState<any[]>([]);
  const [correspondenceOuts, setCorrespondenceOuts] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    caseId: "",
    utpId: "",
    correspondenceId: "",
  });

  const sp = spfi().using(SPFx(SpfxContext));

  useEffect(() => {
    loadDocumentFiles();
    loadLookupValues();
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
          "TimeLastModified",
          "Case/Title",
          "Case/ID",
          "UTP/Title",
          "CorrespondenceOut/Title"
        )
        .expand("Case", "UTP", "CorrespondenceOut")();
      console.log("DOCS", items);

      setDocumentFiles(items);
      setFilteredDocs(items); // show all initially
    } catch (error) {
      console.error("Error fetching document files:", error);
    }
  };

  const loadLookupValues = async () => {
    try {
      const caseItems = await sp.web.lists
        .getByTitle("Cases")
        .items.select("Id", "Title")();

      const utpItems = await sp.web.lists
        .getByTitle("UTPData")
        .items.select("Id", "Title")();

      const coItems = await sp.web.lists
        .getByTitle("CorrespondenceOut")
        .items.select("Id", "Title")();

      setCases(caseItems);
      setUtps(utpItems);
      setCorrespondenceOuts(coItems);
    } catch (error) {
      console.error("Error fetching lookup lists:", error);
    }
  };

  // run filters whenever user changes input
  useEffect(() => {
    let filtered = [...documentFiles];

    if (searchText) {
      filtered = filtered.filter((d) =>
        d.FileLeafRef.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filters.caseId) {
      filtered = filtered.filter(
        (d) =>
          d.Case?.Title?.toLowerCase() === filters.caseId.toLowerCase() ||
          d.Case?.Id?.toString() === filters.caseId
      );
    }

    if (filters.utpId) {
      filtered = filtered.filter(
        (d) =>
          d.UTP?.Title?.toLowerCase() === filters.utpId.toLowerCase() ||
          d.UTP?.Id?.toString() === filters.utpId
      );
    }

    if (filters.correspondenceId) {
      filtered = filtered.filter(
        (d) =>
          d.CorrespondenceOut?.Title?.toLowerCase() ===
            filters.correspondenceId.toLowerCase() ||
          d.CorrespondenceOut?.Id?.toString() === filters.correspondenceId
      );
    }

    setFilteredDocs(filtered);
  }, [searchText, filters, documentFiles]);

  // icons
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf")) return pdfIcon;
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx"))
      return wordIcon;
    if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) return xlsIcon;
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) return imageIcon;
    return defaultIcon;
  };

  const formatSize = (bytes: string) => {
    const mb = parseFloat(bytes) / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <div>
      {/* Filters Row */}
      <div className={styles.filtersRow}>
        <TextField
          label="Search"
          placeholder="Search by file name"
          value={searchText}
          onChange={(_, val) => setSearchText(val || "")}
          styles={{ root: { minWidth: 200, marginRight: 16 } }}
        />

        <ComboBox
          label="Case"
          placeholder="Select or type Case"
          allowFreeform
          autoComplete="on"
          options={cases.map((c) => ({ key: c.Id, text: c.Title }))}
          selectedKey={cases.find((c) => c.Title === filters.caseId)?.Id}
          text={filters.caseId}
          onChange={(_, option, __, value) =>
            setFilters((f) => ({
              ...f,
              caseId: option?.text || value || "",
            }))
          }
          styles={{ root: { minWidth: 180, marginRight: 16 } }}
        />

        <ComboBox
          label="UTP"
          placeholder="Select or type UTP"
          allowFreeform
          autoComplete="on"
          options={utps.map((u) => ({ key: u.Id, text: u.Title }))}
          selectedKey={utps.find((u) => u.Title === filters.utpId)?.Id}
          text={filters.utpId}
          onChange={(_, option, __, value) =>
            setFilters((f) => ({
              ...f,
              utpId: option?.text || value || "",
            }))
          }
          styles={{ root: { minWidth: 180, marginRight: 16 } }}
        />

        <ComboBox
          label="Correspondence Out"
          placeholder="Select or type Correspondence"
          allowFreeform
          autoComplete="on"
          options={correspondenceOuts.map((co) => ({
            key: co.Id,
            text: co.Title,
          }))}
          selectedKey={
            correspondenceOuts.find(
              (co) => co.Title === filters.correspondenceId
            )?.Id
          }
          text={filters.correspondenceId}
          onChange={(_, option, __, value) =>
            setFilters((f) => ({
              ...f,
              correspondenceId: option?.text || value || "",
            }))
          }
          styles={{ root: { minWidth: 220, marginRight: 16 } }}
        />

        <Button
          variant="light"
          style={{
            marginLeft: 16,
            border: "1px solid #ccc",
            background: "#f9f9f9",
            marginTop: 24,
          }}
          onClick={() => {
            setSearchText("");
            setFilters({ caseId: "", utpId: "", correspondenceId: "" });
            setFilteredDocs(documentFiles);
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Document Grid */}
      <div className={styles.documentGrid}>
        {filteredDocs.map((file, index) => (
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
    </div>
  );
};

export default DocumentGrid;
