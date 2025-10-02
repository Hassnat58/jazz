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
    caseId: 0,
    utpId: 0,
    correspondenceId: 0,
  });

  const sp = spfi().using(SPFx(SpfxContext));

  useEffect(() => {
    loadDocumentFiles();
    loadLookupValues();
  }, []);

  // ✅ load files with lookup values
  const loadDocumentFiles = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle("Core Data Repositories")
        .items.select(
          "Id",
          "FileLeafRef",
          "File/Name",
          "File/ServerRelativeUrl",
          "File/Length",
          "File/TimeCreated",
          "File/TimeLastModified",
          "Case/Id",
          "Case/Title",
          "UTP/Id",
          "UTP/UTPId",
          "CorrespondenceOut/Id",
          "CorrespondenceOut/Title"
        )
        .expand("File", "Case", "UTP", "CorrespondenceOut")();

      console.log("DOCS", items);

      setDocumentFiles(items);
      setFilteredDocs(items); // show all initially
    } catch (error) {
      console.error("Error fetching document files:", error);
    }
  };

  // ✅ load lookup dropdown values
  const loadLookupValues = async () => {
    try {
      const caseItems = await sp.web.lists
        .getByTitle("Cases")
        .items.select("Id", "Title")();

      const utpItems = await sp.web.lists
        .getByTitle("UTPData")
        .items.select("Id", "UTPId")();

      const coItems = await sp.web.lists
        .getByTitle("CorrespondenceOut")
        .items.select("Id", "CaseNumber/Title")
        .expand("CaseNumber")();

      // ✅ remove duplicates by Id
      const uniqueCases = caseItems.filter(
        (v, i, a) => a.findIndex((t) => t.Id === v.Id) === i
      );
      const uniqueUtps = utpItems.filter(
        (v, i, a) => a.findIndex((t) => t.Id === v.Id) === i
      );
      const uniqueCos = coItems.filter(
        (v, i, a) => a.findIndex((t) => t.Id === v.Id) === i
      );

      setCases(uniqueCases);
      setUtps(uniqueUtps);
      setCorrespondenceOuts(uniqueCos);
    } catch (error) {
      console.error("Error fetching lookup lists:", error);
    }
  };

  useEffect(() => {
    let filtered = [...documentFiles];

    if (searchText) {
      filtered = filtered.filter((d) =>
        d.File?.Name?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filters.caseId) {
      filtered = filtered.filter((d) => d.Case?.Id === filters.caseId);
    }

    if (filters.utpId) {
      filtered = filtered.filter((d) => d.UTP?.Id === filters.utpId);
    }

    if (filters.correspondenceId) {
      filtered = filtered.filter(
        (d) => d.CorrespondenceOut?.Id === filters.correspondenceId
      );
    }

    setFilteredDocs(filtered);
  }, [searchText, filters, documentFiles]);

  // ✅ file icons
  const getFileIcon = (fileName: string) => {
    if (!fileName) return defaultIcon;
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

        {/* Case Dropdown */}
        <ComboBox
          label="Case"
          placeholder="Select Case"
          options={cases.map((c) => ({
            key: c.Id,
            text: c.Title, // ✅ Case Title
          }))}
          selectedKey={filters.caseId || null}
          allowFreeform
          useComboBoxAsMenuWidth
          autoComplete="on"
          onChange={(_, option, __, value) =>
            setFilters((f) => ({
              ...f,
              caseId: option ? Number(option.key) : Number(value) || 0,
            }))
          }
          styles={{
            root: { width: "200px" },
            container: { width: "200px" },
            callout: {
              width: "100%",
              maxHeight: 5 * 36,
              overflowY: "auto",
            },
            optionsContainerWrapper: {
              maxHeight: 5 * 36,
              overflowY: "auto",
            },
            input: { width: "100%" },
          }}
        />

        {/* UTP Dropdown */}
        <ComboBox
          label="UTP"
          placeholder="Select UTP"
          options={utps.map((u) => ({
            key: u.Id,
            text: u.UTPId, // ✅ UTPId
          }))}
          selectedKey={filters.utpId || null}
          allowFreeform
          useComboBoxAsMenuWidth
          autoComplete="on"
          onChange={(_, option, __, value) =>
            setFilters((f) => ({
              ...f,
              utpId: option ? Number(option.key) : Number(value) || 0,
            }))
          }
          styles={{
            root: { width: "200px" },
            container: { width: "200px" },
            callout: {
              width: "100%",
              maxHeight: 5 * 36,
              overflowY: "auto",
            },
            optionsContainerWrapper: {
              maxHeight: 5 * 36,
              overflowY: "auto",
            },
            input: { width: "100%" },
          }}
        />

        {/* Correspondence Out Dropdown */}
        <ComboBox
          label="Correspondence Out"
          placeholder="Select Correspondence"
          options={correspondenceOuts.map((co) => ({
            key: co.Id,
            text: co.CaseNumber?.Title || `CO-${co.Id}`, // ✅ CaseNumber Title
          }))}
          selectedKey={filters.correspondenceId || null}
          allowFreeform
          useComboBoxAsMenuWidth
          autoComplete="on"
          onChange={(_, option, __, value) =>
            setFilters((f) => ({
              ...f,
              correspondenceId: option
                ? Number(option.key)
                : Number(value) || 0,
            }))
          }
          styles={{
            root: { width: "200px" },
            container: { width: "200px" },
            callout: {
              width: "100%",
              maxHeight: 5 * 36,
              overflowY: "auto",
            },
            optionsContainerWrapper: {
              maxHeight: 5 * 36,
              overflowY: "auto",
            },
            input: { width: "100%" },
          }}
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
            setFilters({ caseId: 0, utpId: 0, correspondenceId: 0 });
            setFilteredDocs(documentFiles);
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Document Grid */}
      <div className={styles.documentGrid}>
        {filteredDocs.map((item, index) => (
          <div key={index} className={styles.documentCard}>
            <img
              src={getFileIcon(item.File?.Name)}
              alt="icon"
              className={styles.fileIcon}
            />
            <p className={styles.fileName}>{item.File?.Name}</p>
            <p className={styles.fileSize}>
              {item.File?.Length ? formatSize(item.File.Length) : ""}
            </p>
            <div className={styles.actions}>
              <Button
                href={item.File?.ServerRelativeUrl}
                target="_blank"
                rel="noreferrer"
                title="View"
                variant="outline-warning"
                size="sm"
              >
                👁
              </Button>
              <a
                href={item.File?.ServerRelativeUrl}
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
