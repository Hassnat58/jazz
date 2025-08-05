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

  const fieldMapping = {
    UTPCategory: "UTP Category",
    RiskCategory: "Risk Category",
    TaxMatter: "Tax Matter",
    PaymentType: "Payment Type",
    GRSCode: "GRS Code",
  };

  const dropdownFields = Object.keys(fieldMapping);

  const inputFields = [
    { label: "UTP ID", name: "UTPID" },
    { label: "GMLR ID", name: "GMLRID" },
    { label: "Gross Exposure", name: "GrossExposure" },
    { label: "Cash Flow Exposure", name: "CashFlowExposure" },
    { label: "ERM Unique Numbering", name: "ERMUniqueNumbering" },
  ];

  const dateFields = [{ label: "UTP Date", name: "UTPDate" }];

  const booleanFields = [
    { label: "P&L Exposure Exists", name: "PLExposureExists" },
    { label: "EBITDA Exposure Exists", name: "EBITDAExposureExists" },
    { label: "Contingency Note Exists", name: "ContingencyNoteExists" },
    { label: "Provision Required", name: "ProvisionRequired" },
  ];

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
      dropdownFields.forEach((f) => (prefilled[f] = selectedCase[f] || ""));
      inputFields.forEach(
        (f) => (prefilled[f.name] = selectedCase[f.name] || "")
      );
      dateFields.forEach(
        ({ name }) =>
          (prefilled[name] = selectedCase[name]
            ? new Date(selectedCase[name])
            : null)
      );
      booleanFields.forEach(
        ({ name }) => (prefilled[name] = Boolean(selectedCase[name]))
      );
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
      Status: isDraft ? "Draft" : "Pending",
      CaseNumberId: data.CaseNumber || null,
    };

    dropdownFields.forEach((key) => (itemData[key] = data[key] || ""));
    inputFields.forEach(({ name }) => (itemData[name] = data[name] || ""));
    dateFields.forEach(
      ({ name }) =>
        (itemData[name] = data[name] ? data[name].toISOString() : null)
    );
    booleanFields.forEach(({ name }) => (itemData[name] = !!data[name]));

    try {
      let itemId = selectedCase?.ID;
      if (itemId) {
        await sp.web.lists
          .getByTitle("UTP Data")
          .items.getById(itemId)
          .update(itemData);
      } else {
        const result = await sp.web.lists
          .getByTitle("UTP Data")
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

  const formStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
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

      <div style={formStyle}>
        <Controller
          name="CaseNumber"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="Case Number"
              options={caseOptions}
              selectedKey={field.value}
              onChange={(_, option) => field.onChange(option?.key)}
              placeholder="Select Case Number"
              required
            />
          )}
        />

        {dropdownFields.map((field) => (
          <Controller
            key={field}
            name={field}
            control={control}
            render={({ field: f }) => (
              <Dropdown
                label={field}
                options={lovOptions[field] || []}
                selectedKey={f.value}
                onChange={(_, o) => f.onChange(o?.key)}
              />
            )}
          />
        ))}

        {inputFields.map(({ label, name }) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field }) => <TextField label={label} {...field} />}
          />
        ))}

        {dateFields.map(({ label, name }) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field }) => (
              <DatePicker
                label={label}
                value={field.value}
                onSelectDate={field.onChange}
                placeholder="Select a date"
              />
            )}
          />
        ))}

        <div style={{ gridColumn: "span 3" }}>
          <label style={{ fontWeight: 600 }}>Attachments</label>
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

        {booleanFields.map(({ label, name }) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field }) => (
              <div>
                <label style={{ fontWeight: 600 }}>{label}</label>
                <div>
                  <label>
                    <input
                      type="radio"
                      value="true"
                      checked={field.value === true}
                      onChange={() => field.onChange(true)}
                    />
                    Yes
                  </label>
                  <label style={{ marginLeft: "10px" }}>
                    <input
                      type="radio"
                      value="false"
                      checked={field.value === false}
                      onChange={() => field.onChange(false)}
                    />
                    No
                  </label>
                </div>
              </div>
            )}
          />
        ))}
      </div>
    </form>
  );
};

export default UTPForm;
