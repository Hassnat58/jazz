/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
import { ToastContainer, toast } from "react-toastify";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { TextField } from "@fluentui/react/lib/TextField";
import { DatePicker } from "@fluentui/react/lib/DatePicker";
import styles from "./Response.module.scss";
import "react-toastify/dist/ReactToastify.css";
import { ComboBox, IComboBoxOption } from "@fluentui/react/lib/ComboBox";

interface CorrespondenceOutFormProps {
  onCancel: () => void;
  onSave: (data: any) => void;
  SpfxContext: any;
  selectedCase?: any;
  notiID?: any;
}

interface AttachmentWithRename {
  file: File;
  originalName: string;
  newName: string;
  isRenamed: boolean;
}

interface ExistingAttachmentWithRename {
  ID: string;
  FileLeafRef: string;
  FileRef: string;
  FileRef2?: string;
  originalName: string;
  newName: string;
  isRenamed: boolean;
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
  const [attachments, setAttachments] = useState<AttachmentWithRename[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<
    ExistingAttachmentWithRename[]
  >([]);
  const [editingAttachment, setEditingAttachment] = useState<string | null>(
    null
  );

  const [tempName, setTempName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const [allCases, setAllCases] = useState<IComboBoxOption[]>([]);
  const [caseOptions, setCaseOptions] = useState<IComboBoxOption[]>([]);

  const getFormattedCaseNumber = (item: any) => {
    // default CN
    let prefix = "CN";
    if (item.TaxType === "Income Tax") prefix = "IT";
    if (item.TaxType === "Sales Tax") prefix = "ST";

    // TaxAuthority can be lookup or string
    const taxAuth = item.TaxAuthority?.Title || item.TaxAuthority || "N/A";

    return `${prefix}-${taxAuth}-${item.Id}`;
  };

  // Helper function to get file extension
  const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : "";
  };

  // Helper function to get filename without extension
  const getFileNameWithoutExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
  };

  // Start editing attachment name
  const startEditingAttachment = (id: string, currentName: string) => {
    setEditingAttachment(id);
    setTempName(getFileNameWithoutExtension(currentName));
  };

  // Save attachment name change
  const saveAttachmentName = (id: string, isExisting: boolean = true) => {
    const extension = isExisting
      ? getFileExtension(
          existingAttachments.find((att) => att.ID === id)?.originalName || ""
        )
      : getFileExtension(
          attachments.find((att) => att.file.name === id)?.originalName || ""
        );

    const newFullName = tempName.trim() + extension;

    if (isExisting) {
      setExistingAttachments((prev) =>
        prev.map((att) =>
          att.ID === id
            ? {
                ...att,
                newName: newFullName,
                isRenamed: newFullName !== att.originalName,
              }
            : att
        )
      );
    } else {
      setAttachments((prev) =>
        prev.map((att) =>
          att.file.name === id
            ? {
                ...att,
                newName: newFullName,
                isRenamed: newFullName !== att.originalName,
              }
            : att
        )
      );
    }

    setEditingAttachment(null);
    setTempName("");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingAttachment(null);
    setTempName("");
  };

  useEffect(() => {
    const fetchCases = async () => {
      const items = await sp.web.lists
        .getByTitle("Cases")
        .items.select("Id", "Title", "TaxType", "CaseStatus", "TaxAuthority")();

      const options = items
        .filter(
          (item) =>
            item.Title &&
            item.Title.trim() !== "" &&
            (item.CaseStatus === "Approved" || item.CaseStatus === "Active")
        )
        .map((item) => {
          const caseText = getFormattedCaseNumber(item);
          return {
            key: item.Id,
            text: caseText,
            data: item,
          };
        });

      setAllCases(options);
      setCaseOptions(options); // initially all
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

        setExistingAttachments(
          files.map((file) => ({
            ID: file.ID,
            FileLeafRef: file.FileLeafRef,
            FileRef: file.FileRef,
            originalName: file.FileLeafRef,
            newName: file.FileLeafRef,
            isRenamed: false,
          }))
        );
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

        if (items.length > 0) {
          const attachments = items[0].AttachmentFiles || [];
          setExistingAttachments(
            attachments.map((f: any) => ({
              ID: f.FileName,
              FileLeafRef: f.FileName,
              FileRef2: f.ServerRelativeUrl,
              FileRef: `${window.location.origin}${f.ServerRelativeUrl}`,
              originalName: f.FileName,
              newName: f.FileName,
              isRenamed: false,
            }))
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
    setIsSubmitting(true);

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

      // 🔹 Mark as read (non-blocking)
      if (notiID) markAsRead(notiID).catch(console.error);

      // =====================================
      // 1) Batch upload NEW attachments
      // =====================================
      if (attachments.length > 0) {
        const [batchedSP, execute] = sp.batched();

        attachments.forEach((attachment) => {
          const finalFileName = attachment.isRenamed
            ? attachment.newName
            : attachment.originalName;

          batchedSP.web.lists
            .getByTitle("Core Data Repositories")
            .rootFolder.files.addUsingPath(finalFileName, attachment.file, {
              Overwrite: true,
            })
            .then(async (uploadResult: any) => {
              const fileItem = await sp.web
                .getFileByServerRelativePath(uploadResult.ServerRelativeUrl)
                .getItem();
              return fileItem.update({ CorrespondenceOutId: itemId });
            });
        });

        await execute();
      }

      // =====================================
      // 2) Batch upload EXISTING attachments (from inbox)
      // =====================================
      if (notiID && existingAttachments.length > 0) {
        const [batchedSP, execute] = sp.batched();

        for (const inboxFile of existingAttachments) {
          if (
            attachments.some(
              (att) => att.originalName === inboxFile.FileLeafRef
            )
          ) {
            console.log(
              `Skipping removed attachment: ${inboxFile.FileLeafRef}`
            );
            continue; // skip removed ones
          }

          try {
            const blob = await sp.web
              .getFileByServerRelativePath(inboxFile.FileRef2!)
              .getBlob();

            const finalFileName = inboxFile.isRenamed
              ? inboxFile.newName
              : inboxFile.originalName;

            batchedSP.web.lists
              .getByTitle("Core Data Repositories")
              .rootFolder.files.addUsingPath(finalFileName, blob, {
                Overwrite: true,
              })
              .then(async (uploadResult: any) => {
                const uploadedItem = await sp.web
                  .getFileByServerRelativePath(uploadResult.ServerRelativeUrl)
                  .getItem();
                return uploadedItem.update({ CorrespondenceOutId: itemId });
              });
          } catch (err) {
            console.error("Failed to copy inbox attachment", err);
          }
        }

        await execute();
      }

      // =====================================
      // Success UX
      // =====================================
      toast.success(
        isDraft ? "Draft saved successfully" : "Case submitted successfully",
        {
          icon: "✅",
          style: {
            borderRadius: "10px",
            background: "#f0fff4",
            color: "#2f855a",
          },
        }
      );

      onSave(data);
      reset();
      setAttachments([]);
      setExistingAttachments([]);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Submit error", error);
      alert("Error submitting Correspondence Out");
      setIsSubmitting(false);
    }
  };

  const formStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
  };

  return (
    <>
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
            disabled={isSubmitting}
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className={styles.savebtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>

        <div style={formStyle}>
          <Controller
            name="CaseNumber"
            control={control}
            rules={{ required: "Case Number is required" }}
            render={({ field, fieldState: { error } }) => (
              <ComboBox
                label="Case Number"
                options={caseOptions}
                required
                selectedKey={field.value}
                onChange={(_, option) => field.onChange(option?.key)}
                placeholder="Select Case Number"
                allowFreeform
                autoComplete="on"
                useComboBoxAsMenuWidth
                onInputValueChange={(newValue) => {
                  if (!newValue) {
                    setCaseOptions(allCases);
                  } else {
                    const filtered = allCases.filter((opt) =>
                      opt.text.toLowerCase().includes(newValue.toLowerCase())
                    );
                    setCaseOptions(filtered);
                  }
                }}
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
                  input: { width: "100%" },
                }}
                errorMessage={error?.message}
              />
            )}
          />

          {dropdownFields.map((field) => (
            <Controller
              key={field}
              name={field}
              control={control}
              render={({ field: f }) => (
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "100%",
                  }}
                >
                  <Dropdown
                    key={f.value ?? "empty"}
                    label={fieldMapping[field]}
                    options={lovOptions[field] || []}
                    selectedKey={f.value ?? undefined}
                    onChange={(_, option) => {
                      if (f.value === option?.key) {
                        f.onChange(undefined);
                      } else {
                        f.onChange(option?.key as string);
                      }
                    }}
                  />
                  {f.value && (
                    <button
                      type="button"
                      onClick={() => f.onChange(undefined)}
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
                  const newAttachments: AttachmentWithRename[] = files.map(
                    (file) => ({
                      file,
                      originalName: file.name,
                      newName: file.name,
                      isRenamed: false,
                    })
                  );
                  setAttachments((prev) => [...prev, ...newAttachments]);
                }}
                style={{ display: "none" }}
              />
            </div>

            {/* Existing File List */}
            <div style={{ marginTop: 10 }}>
              {existingAttachments.map((file) => (
                <div
                  key={file.ID}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 5,
                    padding: "5px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                    backgroundColor: "#f9fafb",
                    width: "fit-content", // ⬅️ added
                    maxWidth: "100%", // ⬅️ optional safeguard
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setExistingAttachments((prev) =>
                        prev.filter((att) => att.ID !== file.ID)
                      );
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      color: "red",
                      fontWeight: "bold",
                      cursor: "pointer",
                      padding: "0 5px",
                    }}
                  >
                    ✖
                  </button>

                  {editingAttachment === file.ID ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        flex: 1,
                      }}
                    >
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        style={{
                          border: "1px solid #d1d5db",
                          borderRadius: "3px",
                          padding: "2px 5px",
                          fontSize: "12px",
                          flex: 1,
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            saveAttachmentName(file.ID, true);
                          if (e.key === "Escape") cancelEditing();
                        }}
                        autoFocus
                      />
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        {getFileExtension(file.originalName)}
                      </span>
                      <button
                        type="button"
                        onClick={() => saveAttachmentName(file.ID, true)}
                        style={{
                          border: "none",
                          background: "#10b981",
                          color: "white",
                          borderRadius: "3px",
                          padding: "2px 5px",
                          fontSize: "10px",
                          cursor: "pointer",
                        }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        style={{
                          border: "none",
                          background: "#ef4444",
                          color: "white",
                          borderRadius: "3px",
                          padding: "2px 5px",
                          fontSize: "10px",
                          cursor: "pointer",
                        }}
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <>
                      <a
                        href={file.FileRef + `?web=1`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#2563eb",
                          textDecoration: "none",
                          fontSize: 14,
                          flex: 1,
                        }}
                      >
                        {file.newName}
                        {file.isRenamed && (
                          <span style={{ color: "#10b981", marginLeft: 5 }}>
                            ✓ Renamed
                          </span>
                        )}
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          startEditingAttachment(file.ID, file.newName)
                        }
                        style={{
                          border: "none",
                          background: "#3b82f6",
                          color: "white",
                          borderRadius: "3px",
                          padding: "2px 5px",
                          fontSize: "10px",
                          cursor: "pointer",
                        }}
                      >
                        ✏️ Rename
                      </button>
                    </>
                  )}
                </div>
              ))}

              {/* New Attachments */}
              {attachments.map((attachment, idx) => (
                <div
                  key={`new-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 5,
                    padding: "5px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                    backgroundColor: "#fff7ed",
                    width: "fit-content", // ⬅️ added
                    maxWidth: "100%", // ⬅️ optional safeguard
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
                      fontWeight: "bold",
                      cursor: "pointer",
                      padding: "0 5px",
                    }}
                  >
                    ✖
                  </button>

                  {editingAttachment === attachment.file.name ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        flex: 1,
                      }}
                    >
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        style={{
                          border: "1px solid #d1d5db",
                          borderRadius: "3px",
                          padding: "2px 5px",
                          fontSize: "12px",
                          flex: 1,
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            saveAttachmentName(attachment.file.name, false);
                          if (e.key === "Escape") cancelEditing();
                        }}
                        autoFocus
                      />
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        {getFileExtension(attachment.originalName)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          saveAttachmentName(attachment.file.name, false)
                        }
                        style={{
                          border: "none",
                          background: "#10b981",
                          color: "white",
                          borderRadius: "3px",
                          padding: "2px 5px",
                          fontSize: "10px",
                          cursor: "pointer",
                        }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        style={{
                          border: "none",
                          background: "#ef4444",
                          color: "white",
                          borderRadius: "3px",
                          padding: "2px 5px",
                          fontSize: "10px",
                          cursor: "pointer",
                        }}
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: 14, flex: 1 }}>
                        {attachment.newName}
                        {attachment.isRenamed && (
                          <span style={{ color: "#10b981", marginLeft: 5 }}>
                            ✓ Renamed
                          </span>
                        )}
                      </span>
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>
                        {(attachment.file.size / (1024 * 1024)).toFixed(1)}MB
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          startEditingAttachment(
                            attachment.file.name,
                            attachment.newName
                          )
                        }
                        style={{
                          border: "none",
                          background: "#3b82f6",
                          color: "white",
                          borderRadius: "3px",
                          padding: "2px 5px",
                          fontSize: "10px",
                          cursor: "pointer",
                        }}
                      >
                        ✏️ Rename
                      </button>
                    </>
                  )}
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
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{ zIndex: 999999 }}
      />
    </>
  );
};

export default CorrespondenceOutForm;
