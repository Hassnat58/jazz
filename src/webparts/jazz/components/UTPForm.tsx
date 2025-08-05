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
import { DatePicker } from "@fluentui/react/lib/DatePicker";
import styles from "./CaseForm.module.scss";
import "react-toastify/dist/ReactToastify.css";

interface UTPFormProps {
  onCancel: () => void;
  onSave: (data: any) => void;
  SpfxContext: any;
  selectedCase?: any;
}

const UTPForm: React.FC<UTPFormProps> = ({
  SpfxContext,
  onCancel,
  onSave,
  selectedCase,
}) => {
  const { control, handleSubmit, reset, getValues } = useForm();
  const [lovOptions, setLovOptions] = useState<{
    [key: string]: IDropdownOption[];
  }>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [caseOptions, setCaseOptions] = useState<IDropdownOption[]>([]);

  const sp = spfi().using(SPFx(SpfxContext));

  const requiredLabel = (label: string) => (
    <span>
      <span style={{ color: "red" }}>*</span> {label}
    </span>
  );

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

  useEffect(() => {
    (async () => {
      const [cases, lovs] = await Promise.all([
        sp.web.lists.getByTitle("Cases").items.select("Id", "Title")(),
        sp.web.lists
          .getByTitle("LOV Data")
          .items.select("Id", "Title", "Description", "Status")(),
      ]);

      setCaseOptions(
        cases
          .filter((item) => item.Title?.trim())
          .map((item) => ({ key: item.Id, text: `CN-00${item.Id}` }))
      );

      const activeLOVs = lovs.filter((item) => item.Status === "Active");
      const groupedLOVs: { [key: string]: IDropdownOption[] } = {};
      activeLOVs.forEach(({ Title, Description }) => {
        if (!groupedLOVs[Title]) groupedLOVs[Title] = [];
        groupedLOVs[Title].push({ key: Description, text: Description });
      });
      setLovOptions(groupedLOVs);
    })();
  }, []);

  useEffect(() => {
    const prefillForm = async () => {
      if (!selectedCase) return;
      const prefilled: any = {};
      ["UTPCategory", "TaxMatter", "RiskCategory", "PaymentType"].forEach(
        (f) => (prefilled[f] = selectedCase[f] || "")
      );
      [
        "UTPID",
        "GMLRID",
        "GRSCode",
        "ERMUniqueNumbering",
        "GrossExposure",
        "CashFlowExposure",
      ].forEach((name) => (prefilled[name] = selectedCase[name] || ""));
      [{ name: "UTPDate" }].forEach(
        ({ name }) =>
          (prefilled[name] = selectedCase[name]
            ? new Date(selectedCase[name])
            : null)
      );
      [
        "PLExposureExists",
        "EBITDAExposureExists",
        "ContingencyNoteExists",
        "ProvisionRequired",
      ].forEach((name) => (prefilled[name] = Boolean(selectedCase[name])));
      prefilled.CaseNumber =
        selectedCase?.CaseNumber?.Id || selectedCase?.CaseNumberId || null;
      reset(prefilled);

      const files = await sp.web.lists
        .getByTitle("Core Data Repositories")
        .items.filter(`UTPId eq ${selectedCase.ID}`)
        .select("FileLeafRef", "FileRef", "ID")();
      setExistingAttachments(files);
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
    ["UTPCategory", "TaxMatter", "RiskCategory", "PaymentType"].forEach(
      (key) => (itemData[key] = data[key] || "")
    );
    [
      "UTPID",
      "GMLRID",
      "GRSCode",
      "ERMUniqueNumbering",
      "GrossExposure",
      "CashFlowExposure",
    ].forEach((name) => (itemData[name] = data[name] || ""));
    [{ name: "UTPDate" }].forEach(
      ({ name }) =>
        (itemData[name] = data[name] ? data[name].toISOString() : null)
    );
    [
      "PLExposureExists",
      "EBITDAExposureExists",
      "ContingencyNoteExists",
      "ProvisionRequired",
    ].forEach((name) => (itemData[name] = !!data[name]));

    try {
      let itemId = selectedCase?.ID;
      if (itemId) {
        await sp.web.lists
          .getByTitle("UTPData")
          .items.getById(itemId)
          .update(itemData);
      } else {
        const result = await sp.web.lists
          .getByTitle("UTPData")
          .items.add(itemData);
        itemId = result.ID;
      }

      for (const file of attachments) {
        const upload = await sp.web.lists
          .getByTitle("Core Data Repositories")
          .rootFolder.files.addUsingPath(file.name, file, { Overwrite: true });
        const fileItem = await sp.web
          .getFileByServerRelativePath(upload.ServerRelativeUrl)
          .getItem();
        await fileItem.update({ UTPId: itemId });
      }

      alert(isDraft ? "Draft saved" : "UTP submitted");
      onSave(data);
      reset();
      setAttachments([]);
    } catch (error) {
      console.error("Submit error", error);
      alert("Error submitting UTP");
    }
  };

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
          {selectedCase ? "Submit" : "Submit"}
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
          name="CaseNumber"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="Case Number"
              options={caseOptions}
              selectedKey={field.value}
              onChange={(_, option) => field.onChange(option?.key)}
              placeholder="Select"
              required
            />
          )}
        />
        <Controller
          name="UTPID"
          control={control}
          render={({ field }) => (
            <div>
              <label style={{ fontWeight: 600 }}>
                <span style={{ color: "red" }}>*</span> UTP ID
              </label>
              <TextField placeholder="Enter ID" {...field} />
            </div>
          )}
        />
        <Controller
          name="GMLRID"
          control={control}
          render={({ field }) => (
            <TextField label="* GMLR ID" placeholder="Enter ID" {...field} />
          )}
        />

        {/* Row 2 */}
        <Controller
          name="GRSCode"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="* GRS Code"
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
        <Controller
          name="CashFlowExposure"
          control={control}
          render={({ field }) => (
            <div>
              <TextField
                placeholder="Enter Value"
                {...field}
                label="Cash Flow Exposure"
                required
              />
            </div>
          )}
        />
        <Controller
          name="PLExposureExists"
          control={control}
          render={({ field }) => renderRadioGroup("P&L Exposure Exists", field)}
        />
        <Controller
          name="EBITDAExposureExists"
          control={control}
          render={({ field }) =>
            renderRadioGroup("EBITDA Exposure Exists", field)
          }
        />

        {/* Row 4 */}
        <Controller
          name="ContingencyNoteExists"
          control={control}
          render={({ field }) =>
            renderRadioGroup("Contingency Note Exists", field)
          }
        />
        <Controller
          name="RiskCategory"
          control={control}
          render={({ field }) => (
            <div>
              <Dropdown
                options={lovOptions["Risk Category"] || []}
                selectedKey={field.value}
                label="* Risk Category"
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
          name="TaxMatter"
          control={control}
          render={({ field }) => (
            <div>
              <Dropdown
                options={lovOptions["Tax Matter"] || []}
                selectedKey={field.value}
                label="Tax Matter"
                onChange={(_, o) => field.onChange(o?.key)}
                placeholder="Select"
                required
              />
            </div>
          )}
        />
        <Controller
          name="ERMUniqueNumbering"
          control={control}
          render={({ field }) => (
            <TextField
              label="* ERM Unique Numbering"
              placeholder="Enter Number"
              {...field}
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
        <div>
          <label style={{ fontWeight: 600 }}>
            {requiredLabel("CPR - Attachments")}
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => setAttachments(Array.from(e.target.files || []))}
          />
          <div>
            {existingAttachments.map((file) => (
              <div key={file.ID}>
                <a href={file.FileRef} target="_blank" rel="noreferrer">
                  {file.FileLeafRef}
                </a>
              </div>
            ))}
            {attachments.map((file, idx) => (
              <div key={`new-${idx}`}>{file.name}</div>
            ))}
          </div>
        </div>

        {/* Row 7 - Date */}
        <Controller
          name="UTPDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="* UTP Date"
              value={field.value}
              onSelectDate={field.onChange}
              placeholder="Select"
            />
          )}
        />
      </div>
    </form>
  );
};

export default UTPForm;
