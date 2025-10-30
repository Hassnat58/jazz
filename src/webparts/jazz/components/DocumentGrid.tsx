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
          "File/UniqueId",
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
      // ✅ Fetch all three lookup lists
      const [caseItems, utpItems, coItems] = await Promise.all([
        sp.web.lists.getByTitle("Cases").items.select("Id", "Title")(),
        sp.web.lists.getByTitle("UTPData").items.select("Id", "UTPId")(),
        sp.web.lists
          .getByTitle("CorrespondenceOut")
          .items.select("Id", "CaseNumber/Title")
          .expand("CaseNumber")(),
      ]);

      // ✅ Deduplicate Cases → Keep latest (highest ID) per Title
      const uniqueCasesMap = new Map<string, any>();
      for (const item of caseItems) {
        const existing = uniqueCasesMap.get(item.Title);
        if (!existing || item.Id > existing.Id) {
          uniqueCasesMap.set(item.Title, item);
        }
      }
      const uniqueCases = Array.from(uniqueCasesMap.values());

      // ✅ Deduplicate UTPs → Keep latest (highest ID) per UTPId
      const uniqueUtpsMap = new Map<string, any>();
      for (const item of utpItems) {
        const existing = uniqueUtpsMap.get(item.UTPId);
        if (!existing || item.Id > existing.Id) {
          uniqueUtpsMap.set(item.UTPId, item);
        }
      }
      const uniqueUtps = Array.from(uniqueUtpsMap.values());

      // ✅ Deduplicate CorrespondenceOut → Keep latest (highest ID) per CaseNumber Title
      const uniqueCosMap = new Map<string, any>();
      for (const item of coItems) {
        const title = item.CaseNumber?.Title || `CO-${item.Id}`;
        const existing = uniqueCosMap.get(title);
        if (!existing || item.Id > existing.Id) {
          uniqueCosMap.set(title, item);
        }
      }
      const uniqueCos = Array.from(uniqueCosMap.values());

      // ✅ Update state
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
        <div style={{ position: "relative", width: "200px" }}>
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
              root: { width: "100%" },
              container: { width: "100%" },
              callout: {
                width: "100%",
                maxHeight: 5 * 36,
                overflowY: "auto",
              },
              optionsContainerWrapper: {
                maxHeight: 5 * 36,
                overflowY: "auto",
              },
              input: { width: "100%", paddingRight: "30px" }, // leave space for ✖
            }}
          />

          {filters.caseId !== 0 && (
            <button
              type="button"
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  caseId: 0,
                }))
              }
              style={{
                position: "absolute",
                right: 20,
                top: "75%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "16px",
                color: "#888",
              }}
            >
              ✖
            </button>
          )}
        </div>

        {/* UTP Dropdown */}
        <div style={{ position: "relative", width: "200px" }}>
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
              root: { width: "100%" },
              container: { width: "100%" },
              callout: {
                width: "100%",
                maxHeight: 5 * 36,
                overflowY: "auto",
              },
              optionsContainerWrapper: {
                maxHeight: 5 * 36,
                overflowY: "auto",
              },
              input: { width: "100%", paddingRight: "30px" }, // Space for ✖
            }}
          />

          {filters.utpId !== 0 && (
            <button
              type="button"
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  utpId: 0,
                }))
              }
              style={{
                position: "absolute",
                right: 20,
                top: "75%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "16px",
                color: "#888",
              }}
            >
              ✖
            </button>
          )}
        </div>

        {/* Correspondence Out Dropdown */}
        <div style={{ position: "relative", width: "200px" }}>
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
              root: { width: "100%" },
              container: { width: "100%" },
              callout: {
                width: "100%",
                maxHeight: 5 * 36,
                overflowY: "auto",
              },
              optionsContainerWrapper: {
                maxHeight: 5 * 36,
                overflowY: "auto",
              },
              input: { width: "100%", paddingRight: "30px" }, // Space for ✖
            }}
          />

          {filters.correspondenceId !== 0 && (
            <button
              type="button"
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  correspondenceId: 0,
                }))
              }
              style={{
                position: "absolute",
                right: 20,
                top: "75%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "16px",
                color: "#888",
              }}
            >
              ✖
            </button>
          )}
        </div>

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
                title="View"
                variant="outline-warning"
                size="sm"
                onClick={() => {
                  const file = item.File;
                  if (!file || !file.ServerRelativeUrl) return;

                  const siteUrl = SpfxContext.pageContext.site.absoluteUrl;
                  const tenantUrl =
                    SpfxContext.pageContext.web.absoluteUrl.split("/sites/")[0];
                  const fileName = file.Name?.toLowerCase() || "";

                  // ✅ Build correct full URL (no double /sites/)
                  const fileUrl = `${tenantUrl}${file.ServerRelativeUrl}`;

                  // Identify file types
                  const isOfficeDoc =
                    fileName.endsWith(".doc") ||
                    fileName.endsWith(".docx") ||
                    fileName.endsWith(".xls") ||
                    fileName.endsWith(".xlsx") ||
                    fileName.endsWith(".ppt") ||
                    fileName.endsWith(".pptx");

                  const isDirectOpen =
                    fileName.endsWith(".pdf") ||
                    fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/) ||
                    fileName.endsWith(".tsx") ||
                    fileName.endsWith(".txt") ||
                    fileName.endsWith(".json");

                  if (isOfficeDoc) {
                    // ✅ Use WOPI viewer for Word, Excel, PowerPoint
                    const wopiUrl = `${siteUrl}/_layouts/15/WopiFrame.aspx?sourcedoc=%7B${file.UniqueId}%7D&action=interactiveview`;
                    window.open(wopiUrl, "_blank");
                  } else if (isDirectOpen) {
                    // ✅ Open PDFs, images, and code/text directly
                    window.open(fileUrl, "_blank");
                  } else {
                    // ✅ Fallback for other file types
                    window.open(fileUrl, "_blank");
                  }
                }}
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
