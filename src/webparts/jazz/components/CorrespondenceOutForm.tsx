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
  notiID?: any;

}

const CorrespondenceOutForm: React.FC<CorrespondenceOutFormProps> = ({
  SpfxContext,
  onCancel,
  onSave,
  notiID,
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

  useEffect(() => {
    const fetchCases = async () => {
      const items = await sp.web.lists
        .getByTitle("Cases")
        .items.select("Id", "Title", "TaxType", "CaseStatus")();

      const options = items
        .filter(
          (item) =>
            item.Title &&
            item.Title.trim() !== "" &&
            item.CaseStatus === "Approved"
        )
        .map((item) => {
          let prefix = "CN"; // default

          if (item.TaxType === "Income Tax") {
            prefix = "IT";
          } else if (item.TaxType === "Sales Tax") {
            prefix = "ST";
          }
          return {
            key: item.Id,
            text: `${prefix}-${item.TaxAuthority}-${item.Id}`,
          };
        });

      setCaseOptions(options);
    };

    const fetchLOVs = async () => {
      const items = await sp.web.lists
        .getByTitle("LOVData1")
        .items.select("Id", "Title", "Value", "Status")();
      const activeItems = items.filter((item) => item.Status === "Active");
      const grouped: { [key: string]: IDropdownOption[] } = {};
      activeItems.forEach((item) => {
        if (!grouped[item.Title]) grouped[item.Title] = [];
        grouped[item.Title].push({
          key: item.Value,
          text: item.Value,
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
useEffect(() => {
    const loadExistingAttachmentsEmail = async () => {
      if (notiID) {
        const items: any[] = await sp.web.lists
          .getByTitle("Inbox")
          .items.filter(`Id eq ${notiID}`)
          .select("Id")
          .expand("AttachmentFiles")();
        // const { pageContext } = SpfxContext;
        if (items.length > 0) {
          const attachments = items[0].AttachmentFiles || [];
          setExistingAttachments(
            attachments.map((f: any) => {
              return {
                ID: f.FileName,
                FileLeafRef: f.FileName,
                FileRef2: f.ServerRelativeUrl,
                FileRef: `${window.location.origin}${f.ServerRelativeUrl}`,
              };
            })
          );
        }
      }
    };

    if (notiID) loadExistingAttachmentsEmail();
  }, [notiID]);
 const markAsRead = async (id: number) => {
    try {
      const spLocal = spfi().using(SPFx(SpfxContext));
      await spLocal.web.lists
        .getByTitle("Inbox")
        .items.getById(id)
        .update({ Status: "Read" });
    } catch (err) {
      console.error("Error updating notification status:", err);
    }
  };
  const submitForm = async (isDraft: boolean) => {
    const data = getValues();
    const itemData: any = {
      IsDraft: isDraft,
      Status: isDraft ? "Draft" : "Pending",
      CorrespondenceOut: data.CorrespondenceOut || "",
      CaseNumberId: data.CaseNumber || null,
    };

    // Dropdowns
    dropdownFields.forEach((key) => {
      itemData[key] = data[key] || "";
    });

    // Dates
    dateFields.forEach(({ name }) => {
      itemData[name] = data[name] ? data[name].toISOString() : null;
    });

    // Multiline text
    multilineFields.forEach(({ name }) => {
      itemData[name] = data[name] || "";
    });

    try {
      let itemId: number;

      if (isDraft && selectedCase?.ID && selectedCase?.Status === "Draft") {
        // 🔹 Update existing Draft
        await sp.web.lists
          .getByTitle("CorrespondenceOut")
          .items.getById(selectedCase.ID)
          .update({
            ...itemData,
            LinkedNotificationIDId: notiID || null,
          });

        itemId = selectedCase.ID;
      } else {
        // 🔹 Always create new item (for Submit OR new Draft)
        const addResult = await sp.web.lists
          .getByTitle("CorrespondenceOut")
          .items.add({
            ...itemData,
            LinkedNotificationIDId: notiID || null,
          });

        itemId = addResult.ID;
      }
  if (notiID) await markAsRead(notiID);
      // 🔹 Upload new attachments
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
  if (notiID) {
        for (const inboxFile of existingAttachments) {
          if (attachments.includes(inboxFile.FileLeafRef)) {
            console.log(
              `Skipping removed attachment: ${inboxFile.FileLeafRef}`
            );
            continue; // skip this one
          }
          try {
            const blob = await sp.web
              .getFileByServerRelativePath(inboxFile.FileRef2)
              .getBlob();

            const uploadResult: any = await sp.web.lists
              .getByTitle("Core Data Repositories")
              .rootFolder.files.addUsingPath(inboxFile.FileLeafRef, blob, {
                Overwrite: true,
              });

            const uploadedItem = await sp.web
              .getFileByServerRelativePath(uploadResult.ServerRelativeUrl)
              .getItem();

            await uploadedItem.update({ CorrespondenceOutId: itemId });
          } catch (err) {
            console.error("Failed to copy inbox attachment", err);
          }
        }
      }
      // 🔹 Success messages
      if (isDraft) {
        alert(
          selectedCase?.Status === "Draft"
            ? "Draft updated successfully"
            : "Draft saved successfully"
        );
      } else {
        alert("Correspondence submitted successfully");
      }

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
          Submit
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
                label={fieldMapping[field]}
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
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setAttachments((prev) => [...prev, ...files]);
              }}
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
                                 href={file.FileRef + `?web=1`}

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
                  type="button"
                  onClick={() => {
                    const updated = [...attachments];
                    updated.splice(idx, 1);
                    setAttachments(updated);
                  }}
                  style={{
                    border: "none",
                    background: "none",
                    color: "red",
                    marginTop: "20px",
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
