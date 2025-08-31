/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/attachments";

import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { TextField } from "@fluentui/react/lib/TextField";
import { DatePicker, IDatePicker } from "@fluentui/react/lib/DatePicker";
import styles from "./CaseForm.module.scss";
import "react-toastify/dist/ReactToastify.css";
import { Dialog, DialogFooter, PrimaryButton } from "@fluentui/react";

interface UTPFormProps {
  onCancel: () => void;
  onSave: (data: any) => void;
  SpfxContext: any;
  selectedCase?: any;
  loadUtpData: any;
}

const UTPForm: React.FC<UTPFormProps> = ({
  SpfxContext,
  onCancel,
  onSave,
  selectedCase,
  loadUtpData,
}) => {
  const { control, handleSubmit, reset, getValues, watch } = useForm();
  const [lovOptions, setLovOptions] = useState<{
    [key: string]: IDropdownOption[];
  }>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [caseOptions, setCaseOptions] = useState<IDropdownOption[]>([]);
  const [allCases, setAllCases] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [taxIssueEntries, setTaxIssueEntries] = useState<
    {
      id: any;
      taxIssue: string;
      RiskCategory?: string;
      grossTaxExposure: number;
    }[]
  >([]);

  const sp = spfi().using(SPFx(SpfxContext));

  const renderRadioGroup = (label: string, field: any) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={{ fontWeight: 600, marginBottom: "4px" }}>{label}</label>
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="radio"
            checked={field.value === true}
            onChange={() => field.onChange(true)}
          />
          Yes
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="radio"
            checked={field.value === false}
            onChange={() => field.onChange(false)}
          />
          No
        </label>
      </div>
    </div>
  );

  const selectedTaxType = watch("TaxType");
  useEffect(() => {
    (async () => {
      const [cases, lovs] = await Promise.all([
        sp.web.lists
          .getByTitle("Cases")
          .items.select("Id", "Title", "TaxType")(), // 👈 include TaxType
        sp.web.lists
          .getByTitle("LOV Data")
          .items.select("Id", "Title", "Description", "Status")(),
      ]);

      setAllCases(cases);

      // LOV grouped options
      const activeLOVs = lovs.filter((item) => item.Status === "Active");
      const groupedLOVs: { [key: string]: IDropdownOption[] } = {};
      activeLOVs.forEach(({ Title, Description }) => {
        if (!groupedLOVs[Title]) groupedLOVs[Title] = [];
        groupedLOVs[Title].push({ key: Description, text: Description });
      });
      setLovOptions(groupedLOVs);
    })();
  }, []);

  // Build case dropdown whenever tax type changes
  useEffect(() => {
    if (selectedTaxType) {
      // filter only cases of that tax type
      const filtered = allCases.filter(
        (item) => item.TaxType === selectedTaxType
      );

      // choose prefix
      const prefix = selectedTaxType === "Income Tax" ? "IT" : "ST";

      setCaseOptions(
        filtered.map((item) => ({
          key: item.Id,
          text: `${prefix}-${item.Id.toString().padStart(4, "0")}`,
        }))
      );
    } else {
      // no tax type → show all cases with CN prefix
      setCaseOptions(
        allCases.map((item) => ({
          key: item.Id,
          text: `CN-${item.Id.toString().padStart(4, "0")}`,
        }))
      );
    }
  }, [selectedTaxType, allCases]);

  useEffect(() => {
    const prefillForm = async () => {
      if (!selectedCase) return;

      const prefilled: any = {};
      ["UTPCategory", "TaxType", "RiskCategory", "PaymentType"].forEach(
        (f) => (prefilled[f] = selectedCase[f] || "")
      );
      ["GRSCode", "ERMUniqueNumbering", "GrossExposure"].forEach(
        (name) => (prefilled[name] = selectedCase[name] || "")
      );
      [{ name: "UTPDate" }].forEach(
        ({ name }) =>
          (prefilled[name] = selectedCase[name]
            ? new Date(selectedCase[name])
            : null)
      );
      ["ContingencyNoteExists", "ProvisionRequired"].forEach((name) => {
        prefilled[name] =
          selectedCase[name] === true
            ? true
            : selectedCase[name] === false
            ? false
            : null;
      });

      prefilled.CaseNumber =
        selectedCase?.CaseNumber?.Id || selectedCase?.CaseNumberId || null;
      prefilled.UTPId = selectedCase?.UTPId || null;
      prefilled.GMLRID = selectedCase?.GMLRID || null;

      prefilled.PLExposure =
        selectedCase.PLExposure !== undefined &&
        selectedCase.PLExposure !== null
          ? Number(selectedCase.PLExposure)
          : "";

      // prefilled.EBITDAExposure =
      //   selectedCase.EBITDAExposure !== undefined &&
      //   selectedCase.EBITDAExposure !== null
      //     ? Number(selectedCase.EBITDAExposure)
      //     : "";

      // Text fields
      prefilled.ContigencyNote = selectedCase.ContigencyNote || "";
      prefilled.TaxMatter = selectedCase.TaxMatter || "";

      reset(prefilled);

      // ✅ Fetch existing attachments
      const files = await sp.web.lists
        .getByTitle("Core Data Repositories")
        .items.filter(`UTPId eq ${selectedCase.ID}`)
        .select("FileLeafRef", "FileRef", "ID")();
      setExistingAttachments(files);

      // ✅ Fetch related Tax Issues
      const issues = await sp.web.lists
        .getByTitle("UTP Tax Issue")
        .items.filter(`UTPId eq ${selectedCase.ID}`)
        .select("Id", "Title", "RiskCategory", "GrossTaxExposure")();

      const mappedIssues = issues.map((item) => ({
        id: item.Id,
        taxIssue: item.Title,
        RiskCategory: item.RiskCategory,
        grossTaxExposure: item.GrossTaxExposure,
      }));

      setTaxIssueEntries(mappedIssues);
    };

    prefillForm();
  }, [selectedCase, reset]);

  const submitForm = async (isDraft: boolean) => {
    const data = getValues();
    const itemData: any = {
      IsDraft: isDraft,
      Status: isDraft ? "Draft" : "Open",
      CaseNumberId: data.CaseNumber || null,
    };

    ["UTPCategory", "TaxType", "RiskCategory", "PaymentType"].forEach(
      (key) => (itemData[key] = data[key] || "")
    );
    ["GRSCode", "ERMUniqueNumbering", "GrossExposure"].forEach(
      (name) => (itemData[name] = data[name] || "")
    );
    itemData.UTPDate = data.UTPDate ? data.UTPDate.toISOString() : null;

    itemData.PLExposure =
      data.PLExposure !== undefined && data.PLExposure !== ""
        ? Number(data.PLExposure)
        : null;

    // itemData.EBITDAExposure =
    //   data.EBITDAExposure !== undefined && data.EBITDAExposure !== ""
    //     ? Number(data.EBITDAExposure)
    //     : null;

    itemData.ContigencyNote = data.ContigencyNote || "";
    itemData.GMLRID = data.GMLRID || "";

    try {
      // 🚀 Always create new item
      const result = await sp.web.lists
        .getByTitle("UTPData")
        .items.add(itemData);

      const itemId = result.ID;

      // Update UTPId with generated ID
      await sp.web.lists
        .getByTitle("UTPData")
        .items.getById(itemId)
        .update({
          UTPId: `UTP-00${itemId}`,
        });

      // Attachments
      for (const file of attachments) {
        const upload = await sp.web.lists
          .getByTitle("Core Data Repositories")
          .rootFolder.files.addUsingPath(file.name, file, { Overwrite: true });
        const fileItem = await sp.web
          .getFileByServerRelativePath(upload.ServerRelativeUrl)
          .getItem();
        await fileItem.update({ UTPId: itemId });
      }

      // Tax Issues
      for (const entry of taxIssueEntries) {
        await sp.web.lists.getByTitle("UTP Tax Issue").items.add({
          Title: entry.taxIssue,
          RiskCategory: entry.RiskCategory,
          GrossTaxExposure: entry.grossTaxExposure,
          UTPId: itemId,
        });
      }

      alert(isDraft ? "Draft saved" : "UTP submitted");
      onSave(data);
      loadUtpData;
      reset();
      setAttachments([]);
    } catch (error) {
      console.error("Submit error", error);
      alert("Error submitting UTP");
    }
  };

  const riskCategory = watch("RiskCategory");

  useEffect(() => {
    const loadDefaults = async () => {
      if (!selectedCase) {
        // Only for new item
        const lastItem = await sp.web.lists
          .getByTitle("UTPData")
          .items.orderBy("ID", false) // false = descending
          .top(1)();

        const nextId = lastItem.length > 0 ? lastItem[0].ID + 1 : 1;

        reset({
          UTPId: `UTP-00${nextId}`,
          GMLRID: "",
        });
      }
    };

    loadDefaults();
  }, [selectedCase]);

  const datePickerRef = React.useRef<IDatePicker>(null);

  return (
    <form
      onSubmit={handleSubmit(() => submitForm(false))}
      style={{ marginTop: 0 }}
    >
      <div className={styles.topbuttongroup}>
        <button type="button" className={styles.cancelbtn} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.draftbtn}
          onClick={() => submitForm(true)}
        >
          Save as Draft
        </button>
        <button type="submit" className={styles.savebtn}>
          Submit
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.2rem",
        }}
      >
        {/* Row 1 */}
        <Controller
          name="TaxType"
          control={control}
          render={({ field }) => (
            <div>
              <Dropdown
                options={lovOptions["Tax Type"] || []}
                selectedKey={field.value}
                label="Tax Type"
                onChange={(_, o) => field.onChange(o?.key)}
                placeholder="Select"
                required
              />
            </div>
          )}
        />
        <Controller
          name="CaseNumber"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="Case Number"
              options={caseOptions}
              selectedKey={
                caseOptions.some((opt) => opt.key === field.value)
                  ? field.value
                  : undefined
              }
              onChange={(_, option) => field.onChange(option?.key)}
              placeholder="Select"
              required
              disabled={caseOptions.length === 0} // 👈 optional: disable if no options
            />
          )}
        />
        <Controller
          name="UTPId"
          control={control}
          render={({ field }) => (
            <TextField label="UTP ID" readOnly value={field.value || ""} />
          )}
        />

        <Controller
          name="GMLRID"
          control={control}
          render={({ field }) => (
            <TextField
              label="GMLR ID"
              placeholder="Enter Value"
              {...field}
              required
            />
          )}
        />

        {/* Row 2 */}
        <Controller
          name="GRSCode"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="GRS Code"
              options={lovOptions["GRS Code"] || []}
              selectedKey={field.value}
              onChange={(_, o) => field.onChange(o?.key)}
              placeholder="Select"
            />
          )}
        />
        <Controller
          name="UTPCategory"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="* UTP Category"
              options={lovOptions["UTP Category"] || []}
              selectedKey={field.value}
              onChange={(_, o) => field.onChange(o?.key)}
              placeholder="Select"
            />
          )}
        />
        <Controller
          name="GrossExposure"
          control={control}
          render={({ field }) => (
            <TextField
              label="Gross Exposure"
              required
              placeholder="Enter Value"
              {...field}
            />
          )}
        />

        {/* Row 3 */}
        {/* <Controller
          name="PLExposureExists"
          control={control}
          render={({ field }) => renderRadioGroup("P&L Exposure Exists", field)}
        /> */}
        <Controller
          name="PLExposure"
          control={control}
          render={({ field }) => (
            <TextField
              label="P&L Exposure"
              placeholder="Enter Value"
              {...field}
              // disabled={plexposureExists !== true}
            />
          )}
        />
        {/* <Controller
          name="EBITDAExposureExists"
          control={control}
          render={({ field }) =>
            renderRadioGroup("EBITDA Exposure Exists", field)
          }
        /> */}

        {/* <Controller
          name="EBITDAExposure"
          control={control}
          render={({ field }) => (
            <TextField
              label="EBITDA Exposure"
              placeholder="Enter Value"
              {...field}
              disabled={ebitdaExposureExists !== true}
            />
          )}
        /> */}

        {/* Row 4 */}
        {/* <Controller
          name="ContingencyNoteExists"
          control={control}
          render={({ field }) =>
            renderRadioGroup("Contingency Note Exists", field)
          }
        /> */}
        {riskCategory === "Probable" && (
          <Controller
            name="ContigencyNote"
            control={control}
            rules={{
              required:
                "Contingency Note is required when Risk Category is Probable",
            }}
            render={({ field, fieldState }) => (
              <TextField
                label="Contingency Note"
                placeholder="Enter Note"
                {...field}
                errorMessage={fieldState.error?.message}
              />
            )}
          />
        )}
        <Controller
          name="RiskCategory"
          control={control}
          render={({ field }) => (
            <div>
              <Dropdown
                options={lovOptions["Risk Category"] || []}
                selectedKey={field.value}
                label="Risk Category"
                onChange={(_, o) => field.onChange(o?.key)}
                placeholder="Select"
                required
              />
            </div>
          )}
        />
        <Controller
          name="ProvisionRequired"
          control={control}
          render={({ field }) => renderRadioGroup("Provision Required", field)}
        />

        {/* Row 5 */}

        <Controller
          name="ERMUniqueNumbering"
          control={control}
          render={({ field }) => (
            <TextField
              label="ERM Unique Numbering"
              placeholder="Enter Number"
              {...field}
              required
            />
          )}
        />
        <Controller
          name="PaymentType"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="Payment Type"
              options={lovOptions["Payment Type"] || []}
              selectedKey={field.value}
              onChange={(_, o) => field.onChange(o?.key)}
              placeholder="Select"
              required
            />
          )}
        />

        {/* Row 6 - Attachments */}
        <div style={{ gridColumn: "span 3" }}>
          <label style={{ fontWeight: 600 }}> Attachments</label>

          {/* Upload Box */}
          <div
            style={{
              width: 400,
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: 10,
              marginTop: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 30,
              cursor: "pointer",
              background: "#f9fafb",
            }}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <span style={{ color: "#9ca3af" }}>⬆️ Upload</span>
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={(e) => setAttachments(Array.from(e.target.files || []))}
              style={{ display: "none" }}
            />
          </div>

          {/* File List */}
          <div style={{ marginTop: 10 }}>
            {existingAttachments.map((file) => (
              <div
                key={file.ID}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 5,
                  color: "#374151",
                  fontSize: 14,
                }}
              >
                <span
                  style={{
                    color: "red",
                    fontWeight: "bold",
                    cursor: "not-allowed",
                  }}
                >
                  ✖
                </span>
                <a
                  href={file.FileRef}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#2563eb", textDecoration: "none" }}
                >
                  {file.FileLeafRef}
                </a>
              </div>
            ))}

            {attachments.map((file, idx) => (
              <div
                key={`new-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 5,
                  color: "#374151",
                  fontSize: 14,
                }}
              >
                <button
                  onClick={() => {
                    const updated = [...attachments];
                    updated.splice(idx, 1);
                    setAttachments(updated);
                  }}
                  style={{
                    border: "none",
                    background: "none",
                    color: "red",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ✖
                </button>
                <span>{file.name}</span>
                <span style={{ color: "#9ca3af", fontSize: 12 }}>
                  {(file.size / (1024 * 1024)).toFixed(1)}MB
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 7 - Date */}
        <Controller
          name="UTPDate"
          control={control}
          render={({ field }) => (
            <>
              <DatePicker
                label="* UTP Date"
                value={field.value}
                onSelectDate={(date) => {
                  if (date) {
                    field.onChange(date);
                    datePickerRef.current?.focus();
                    const today = new Date();
                    const currentMonth = today.getMonth();
                    const currentYear = today.getFullYear();

                    const selectedMonth = date.getMonth();
                    const selectedYear = date.getFullYear();

                    const prevMonth =
                      currentMonth === 0 ? 11 : currentMonth - 1;
                    const prevYear =
                      currentMonth === 0 ? currentYear - 1 : currentYear;

                    if (
                      selectedMonth === prevMonth &&
                      selectedYear === prevYear
                    ) {
                      setShowDialog(true);
                    }
                  }
                }}
                placeholder="Select"
              />

              <Dialog
                hidden={!showDialog}
                onDismiss={() => setShowDialog(false)}
                dialogContentProps={{
                  title: "Notice",
                  subText:
                    "You selected a date from the previous month. Please double-check before proceeding.",
                }}
              >
                <DialogFooter>
                  <PrimaryButton
                    onClick={() => setShowDialog(false)}
                    text="OK"
                  />
                </DialogFooter>
              </Dialog>
            </>
          )}
        />
      </div>
      <div style={{ marginTop: "1rem" }}>
        <h3>Tax Issues</h3>
        {taxIssueEntries.map((entry, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            {/* Tax Issue Dropdown */}
            <Dropdown
              label="Tax Issue"
              placeholder="Select Tax Issue"
              options={lovOptions["Tax Issue"] || []}
              selectedKey={entry.taxIssue}
              styles={{ root: { flex: 2 } }}
              onChange={(_, o) => {
                const updated = [...taxIssueEntries];
                updated[idx].taxIssue = o?.key as string;
                setTaxIssueEntries(updated);
              }}
            />

            {/* Amount Contested */}
            <Dropdown
              label="Risk Category"
              selectedKey={entry.RiskCategory}
              options={[
                { key: "Probable", text: "Probable" },
                { key: "Possible", text: "Possible" },
                { key: "Remote", text: "Remote" },
              ]}
              styles={{ root: { flex: 1 } }}
              onChange={(_, option) => {
                const updated = [...taxIssueEntries];
                updated[idx].RiskCategory = (option?.key as string) || "";
                setTaxIssueEntries(updated);
              }}
            />

            {/* Gross Tax Exposure */}
            <TextField
              label="Gross Tax Exposure"
              placeholder="Gross Tax Exposure"
              type="text"
              value={
                entry.grossTaxExposure !== undefined &&
                entry.grossTaxExposure !== null
                  ? new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }).format(entry.grossTaxExposure)
                  : ""
              }
              styles={{ root: { flex: 1 } }}
              onChange={(_, v) => {
                const numericValue =
                  v?.replace(/,/g, "").replace(/[^0-9.]/g, "") || "";
                const updated = [...taxIssueEntries];
                updated[idx].grossTaxExposure = numericValue
                  ? parseFloat(numericValue)
                  : 0;
                setTaxIssueEntries(updated);
              }}
            />

            {/* Remove Button */}
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "red",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={() => {
                const updated = [...taxIssueEntries];
                updated.splice(idx, 1);
                setTaxIssueEntries(updated);
              }}
            >
              ❌
            </button>
          </div>
        ))}

        {/* Add New Button */}
        {taxIssueEntries.length < (lovOptions["Tax Issue"]?.length || 0) && (
          <button
            type="button"
            onClick={() => {
              const used = taxIssueEntries.map((t) => t.taxIssue);
              const available = (lovOptions["Tax Issue"] || []).find(
                (opt) => !used.includes(opt.key as string)
              );
              if (available) {
                setTaxIssueEntries((prev) => [
                  ...prev,
                  {
                    id: null,
                    taxIssue: available.key as string,
                    amountContested: 0,
                    grossTaxExposure: 0,
                  },
                ]);
              }
            }}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ➕ Add New
          </button>
        )}
      </div>
    </form>
  );
};

export default UTPForm;
