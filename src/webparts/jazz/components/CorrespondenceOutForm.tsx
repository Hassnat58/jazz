/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
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

interface CorrespondenceOutFormProps {
  onCancel: () => void;
  onSave: (data: any) => void;
  SpfxContext: any;
  selectedCase?: any;
}

const CorrespondenceOutForm: React.FC<CorrespondenceOutFormProps> = ({
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
  const sp = spfi().using(SPFx(SpfxContext));

  const fieldMapping: { [key: string]: string } = {
    FiledAt: "FiledAt",
    Filedthrough: "Filedthrough",
  };

  const dropdownFields = Object.keys(fieldMapping);
  const inputFields = [
    { label: "Correspondence Out", name: "CorrespondenceOut" },
  ];
  const dateFields = [{ label: "Date Of Filing", name: "Dateoffiling" }];
  const multilineFields = [
    { label: "Brief Description", name: "BriefDescription" },
  ];

  const [caseOptions, setCaseOptions] = useState<IDropdownOption[]>([]);

  // Get Case list items for Lookup
  useEffect(() => {
    const fetchCases = async () => {
      const items = await sp.web.lists
        .getByTitle("Cases")
        .items.select("Id", "Title")();
      const options = items
        .filter((item) => item.Title && item.Title.trim() !== "") // Filter out empty Titles
        .map((item) => ({
          key: item.Id,
          text: `CN-00${item.Id}`,
        }));
      setCaseOptions(options);
    };

    const fetchLOVs = async () => {
      const items = await sp.web.lists
        .getByTitle("LOV Data")
        .items.select("Id", "Title", "Description", "Status")();
      const activeItems = items.filter((item) => item.Status === "Active");
      const grouped: { [key: string]: IDropdownOption[] } = {};
      activeItems.forEach((item) => {
        if (!grouped[item.Title]) grouped[item.Title] = [];
        grouped[item.Title].push({
          key: item.Description,
          text: item.Description,
        });
      });
      setLovOptions(grouped);
    };

    fetchCases();
    fetchLOVs();
  }, []);

  useEffect(() => {
    const loadExistingAttachments = async () => {
      if (selectedCase?.ID) {
        const files = await sp.web.lists
          .getByTitle("Core Data Repositories")
          .items.filter(`CorrespondenceOutId eq ${selectedCase.ID}`)
          .select("FileLeafRef", "FileRef", "ID")();
        setExistingAttachments(files);
      }
    };

    if (selectedCase) {
      const prefilled: any = {};
      dropdownFields.forEach((f) => {
        prefilled[f] = selectedCase[f] || "";
      });
      inputFields.forEach((f) => {
        prefilled[f.name] = selectedCase[f.name] || "";
      });
      dateFields.forEach(({ name }) => {
        prefilled[name] = selectedCase[name]
          ? new Date(selectedCase[name])
          : null;
      });
      multilineFields.forEach((f) => {
        prefilled[f.name] = selectedCase[f.name] || "";
      });
      prefilled["CaseNumber"] =
        selectedCase?.CaseNumber?.Id || selectedCase?.CaseNumberId || null;
      reset(prefilled);
      loadExistingAttachments();
    }
  }, [selectedCase, reset]);

  const submitForm = async (isDraft: boolean) => {
    const data = getValues();
    const itemData: any = {
      IsDraft: isDraft,
      Status: isDraft ? "Draft" : "Pending",
      CorrespondenceOut: data.CorrespondenceOut || "",
      CaseNumberId: data.CaseNumber || null,
    };

    dropdownFields.forEach((key) => {
      itemData[key] = data[key] || "";
    });

    dateFields.forEach(({ name }) => {
      itemData[name] = data[name] ? data[name].toISOString() : null;
    });

    multilineFields.forEach(({ name }) => {
      itemData[name] = data[name] || "";
    });

    try {
      let itemId;
      if (selectedCase?.ID) {
        await sp.web.lists
          .getByTitle("CorrespondenceOut")
          .items.getById(selectedCase.ID)
          .update(itemData);
        itemId = selectedCase.ID;
      } else {
        const addResult = await sp.web.lists
          .getByTitle("CorrespondenceOut")
          .items.add(itemData);
        itemId = addResult.ID;
      }

      // Upload files
      for (const file of attachments) {
        const uploadResult = await sp.web.lists
          .getByTitle("Core Data Repositories")
          .rootFolder.files.addUsingPath(file.name, file, { Overwrite: true });

        const fileItem = await sp.web
          .getFileByServerRelativePath(uploadResult.ServerRelativeUrl)
          .getItem();

        await fileItem.update({
          CorrespondenceOutId: itemId,
        });
      }

      alert(isDraft ? "Draft saved" : "Correspondence submitted");
      onSave(data);
      reset();
      setAttachments([]);
    } catch (error) {
      console.error("Submit error", error);
      alert("Error submitting Correspondence Out");
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
      style={{ marginTop: "0px" }}
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
          {selectedCase ? "Update" : "Save"}
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

        {multilineFields.map(({ label, name }) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field }) => (
              <TextField label={label} {...field} multiline rows={3} />
            )}
          />
        ))}
      </div>
    </form>
  );
};

export default CorrespondenceOutForm;
