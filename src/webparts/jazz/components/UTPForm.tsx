/* eslint-disable promise/param-names */
/* eslint-disable require-atomic-updates */
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { TextField } from "@fluentui/react/lib/TextField";
import { DatePicker, IDatePicker } from "@fluentui/react/lib/DatePicker";
import styles from "./CaseForm.module.scss";
import "react-toastify/dist/ReactToastify.css";
import {
  ComboBox,
  IComboBoxOption,
  Dialog,
  DialogFooter,
  PrimaryButton,
} from "@fluentui/react";

interface UTPFormProps {
  onCancel: () => void;
  onSave: (data: any) => void;
  SpfxContext: any;
  selectedCase?: any;
  loadUtpData: any;
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
const UTPForm: React.FC<UTPFormProps> = ({
  SpfxContext,
  onCancel,
  onSave,
  selectedCase,
  loadUtpData,
}) => {
  const { control, handleSubmit, reset, getValues, watch, setValue } =
    useForm();

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
  const [caseOptions, setCaseOptions] = useState<IComboBoxOption[]>([]);
  const [allCases, setAllCases] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxIssueEntries, setTaxIssueEntries] = useState<
    {
      id: any;
      taxIssue: string;
      RiskCategory?: string;
      contigencynote?: string;
      amountContested: number;
      rate: number;
      grossTaxExposure: number;
    }[]
  >([]);

  const sp = spfi().using(SPFx(SpfxContext));

  const selectedTaxType = watch("TaxType");
  useEffect(() => {
    (async () => {
      const [cases, lovs] = await Promise.all([
        sp.web.lists
          .getByTitle("Cases")
          .items.select(
            "Id",
            "Title",
            "TaxType",
            "CaseStatus",
            "TaxAuthority"
          )(), // 🔹 include CaseStatus
        sp.web.lists
          .getByTitle("LOVData1")
          .items.select("Id", "Title", "Value", "Status")(),
      ]);

      setAllCases(cases);

      // LOV grouped options
      const activeLOVs = lovs.filter((item) => item.Status === "Active");
      const groupedLOVs: { [key: string]: IDropdownOption[] } = {};
      activeLOVs.forEach(({ Title, Value }) => {
        if (!groupedLOVs[Title]) groupedLOVs[Title] = [];
        groupedLOVs[Title].push({ key: Value, text: Value });
      });
      setLovOptions(groupedLOVs);
    })();
  }, []);

  useEffect(() => {
    const activeCases = allCases.filter(
      (item) => item.CaseStatus === "Active" || item.CaseStatus === "Approved"
    );

    if (selectedTaxType) {
      const filtered = activeCases.filter(
        (item) => item.TaxType === selectedTaxType
      );

      // prefix based on tax type
      const prefix = selectedTaxType === "Income Tax" ? "IT" : "ST";

      setCaseOptions(
        filtered.map((item) => {
          const taxAuth = item.TaxAuthority || "N/A";
          const caseNumberText = `${prefix}-${taxAuth}-${item.Id}`;
          return { key: item.Id, text: caseNumberText, data: item };
        })
      );
    } else {
      setCaseOptions(
        activeCases.map((item) => {
          const taxAuth = item.TaxAuthority || "N/A";
          const taxtype = item.TaxType === "Income Tax" ? "IT" : "ST";
          return {
            key: item.Id,
            text: `${taxtype}-${taxAuth}-${item.Id}`,
            data: item,
          };
        })
      );
    }
  }, [selectedTaxType, allCases]);
  const selectedCaseNumberId = watch("CaseNumber");
  let cachedNextId: number | null = null;

  const getNextUTPIdNumber = async (sp: any): Promise<number> => {
    if (cachedNextId !== null) return cachedNextId;

    let retries = 3;
    let delay = 2000;

    while (retries > 0) {
      try {
        // 🔹 only pull ID field of last item
        const items = await sp.web.lists
          .getByTitle("UTPData")
          .items.select("ID")
          .orderBy("ID", false)
          .top(1)();

        const lastId = items.length > 0 ? items[0].ID : 0;
        cachedNextId = lastId + 1; // ✅ cache it
        return cachedNextId ?? 1;
      } catch (err: any) {
        // if throttled
        if (
          err.status === 429 || // too many requests
          err.status === 503 // service unavailable
        ) {
          console.warn(`SharePoint throttled, retrying in ${delay}ms`);
          await new Promise((res) => setTimeout(res, delay));
          retries--;
          delay *= 2; // exponential backoff
        } else {
          throw err;
        }
      }
    }

    // fallback if all retries fail
    return 1;
  };

  useEffect(() => {
    const fetchNextIdAndSetUTPId = async () => {
      if (!selectedCaseNumberId) return;

      const caseId = Number(selectedCaseNumberId);
      const selectedCaseItem = allCases.find((c) => c.Id === caseId);
      if (!selectedCaseItem) return;

      const taxAuth = selectedCaseItem.TaxAuthority || "N/A";

      // ✅ call the safe function
      const nextId = await getNextUTPIdNumber(sp);

      // ✅ set form field to full preview
      setValue("UTPId", `UTP-${taxAuth}-${nextId}`);
    };

    fetchNextIdAndSetUTPId();
  }, [selectedCaseNumberId, allCases, setValue]);

  const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : "";
  };

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
    const prefillForm = async () => {
      if (!selectedCase) return;

      const prefilled: any = {};
      ["UTPCategory", "TaxType", "PaymentType", "ERMCategory"].forEach(
        (f) => (prefilled[f] = selectedCase[f] || "")
      );
      ["GRSCode", "ERMUniqueNumbering"].forEach(
        (name) => (prefilled[name] = selectedCase[name] || "")
      );
      [{ name: "UTPDate" }].forEach(
        ({ name }) =>
          (prefilled[name] = selectedCase[name]
            ? new Date(selectedCase[name])
            : null)
      );
      ["ContingencyNoteExists"].forEach((name) => {
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

      // prefilled.PLExposure =
      //   selectedCase.PLExposure !== undefined &&
      //   selectedCase.PLExposure !== null
      //     ? Number(selectedCase.PLExposure)
      //     : "";

      // prefilled.EBITDAExposure =
      //   selectedCase.EBITDAExposure !== undefined &&
      //   selectedCase.EBITDAExposure !== null
      //     ? Number(selectedCase.EBITDAExposure)

      prefilled.ContigencyNote = selectedCase.ContigencyNote || "";

      reset(prefilled);
      const files = await sp.web.lists
        .getByTitle("Core Data Repositories")
        .items.filter(`UTPId eq ${selectedCase.ID}`)
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

      const issues = await sp.web.lists
        .getByTitle("UTP Tax Issue")
        .items.filter(`UTPId eq ${selectedCase.ID}`)
        .select(
          "Id",
          "Title",
          "RiskCategory",
          "GrossTaxExposure",
          "AmountContested",
          "Rate"
        )();

      const mappedIssues = issues.map((item) => ({
        id: item.Id,
        taxIssue: item.Title,
        RiskCategory: item.RiskCategory,
        contigencyNote: item.ContigencyNote,
        rate: item.Rate,
        amountContested: item.AmountContested,
        grossTaxExposure: item.GrossTaxExposure,
      }));

      setTaxIssueEntries(mappedIssues);
    };

    prefillForm();
  }, [selectedCase, reset]);

  const submitForm = async (isDraft: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const data = getValues();
    const itemData: any = {
      IsDraft: isDraft,
      Status: isDraft ? "Draft" : "Open",
      CaseNumberId: data.CaseNumber || null,
    };

    // Dropdowns
    ["UTPCategory", "TaxType", "PaymentType", "ERMCategory"].forEach(
      (key) => (itemData[key] = data[key] || "")
    );

    // Text fields
    ["GRSCode", "ERMUniqueNumbering"].forEach(
      (name) => (itemData[name] = data[name] || "")
    );

    // Date
    itemData.UTPDate = data.UTPDate ? data.UTPDate.toISOString() : null;

    // Numbers
    // itemData.PLExposure =
    //   data.PLExposure !== undefined && data.PLExposure !== ""
    //     ? Number(data.PLExposure)
    //     : null;

    // itemData.EBITDAExposure = ...

    // Notes
    // itemData.ContigencyNote = data.ContigencyNote || "";
    itemData.GMLRID = data.GMLRID || "";

    try {
      let itemId: number;

      if (isDraft && selectedCase?.ID && selectedCase?.Status === "Draft") {
        // 🔹 Update existing Draft
        await sp.web.lists
          .getByTitle("UTPData")
          .items.getById(selectedCase.ID)
          .update(itemData);

        itemId = selectedCase.ID;
      } else {
        // 🔹 Always create new item (Submit OR new Draft)
        const result = await sp.web.lists
          .getByTitle("UTPData")
          .items.add(itemData);

        itemId = result.ID;

        // Update UTPId with generated ID
        const selectedCaseItem = allCases.find((c) => c.Id === data.CaseNumber);
        const taxAuth = selectedCaseItem?.TaxAuthority || "N/A";
        await sp.web.lists
          .getByTitle("UTPData")
          .items.getById(itemId)
          .update({
            UTPId: `UTP-${taxAuth}-${itemId}`,
          });
        setValue("UTPId", `UTP-${taxAuth}-${itemId}`);
      }

      // 🔹 Upload Attachments
      for (const attachment of attachments) {
        const finalFileName = attachment.isRenamed
          ? attachment.newName
          : attachment.originalName;

        const uploadResult = await sp.web.lists
          .getByTitle("Core Data Repositories")
          .rootFolder.files.addUsingPath(finalFileName, attachment.file, {
            Overwrite: true,
          });

        const fileItem = await sp.web
          .getFileByServerRelativePath(uploadResult.ServerRelativeUrl)
          .getItem();

        await fileItem.update({
          UTPId: itemId,
        });
      }

      // 🔹 Save Tax Issues
      for (const entry of taxIssueEntries) {
        if (entry.id && isDraft && selectedCase?.Status === "Draft") {
          // update existing tax issue
          await sp.web.lists
            .getByTitle("UTP Tax Issue")
            .items.getById(entry.id)
            .update({
              Title: entry.taxIssue,
              RiskCategory: entry.RiskCategory,
              ContigencyNote: entry.contigencynote,
              AmountContested: entry.amountContested,
              Rate: entry.rate,
              GrossTaxExposure: entry.grossTaxExposure,
            });
        } else {
          // create new tax issue
          await sp.web.lists.getByTitle("UTP Tax Issue").items.add({
            Title: entry.taxIssue,
            RiskCategory: entry.RiskCategory,
            AmountContested: entry.amountContested,
            Rate: entry.rate,
            GrossTaxExposure: entry.grossTaxExposure,
            UTPId: itemId,
          });
        }
      }

      const grossExposures = taxIssueEntries.map(
        (entry) => entry.grossTaxExposure || 0
      );
      const totalGrossExposure =
        grossExposures.length === 1
          ? grossExposures[0]
          : grossExposures.reduce((sum, val) => sum + val, 0);

      await sp.web.lists.getByTitle("UTPData").items.getById(itemId).update({
        GrossExposure: totalGrossExposure,
      });

      // 🔹 Success message
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
      loadUtpData;
      reset();
      setAttachments([]);
      setExistingAttachments([]);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Submit error", error);
      toast.error("Error submitting form", {
        icon: "⚠️",
      });
    }
  };

  // const riskCategory = watch("RiskCategory");

  useEffect(() => {
    const loadDefaults = async () => {
      if (!selectedCase) {
        // Only for new item
        const lastItem = await sp.web.lists
          .getByTitle("UTPData")
          .items.orderBy("ID", false)
          .top(1)();

        const nextId = lastItem.length > 0 ? lastItem[0].ID + 1 : 1;

        reset({
          UTPId: `UTP-${nextId}`,
          GMLRID: "",
        });
      }
    };

    loadDefaults();
  }, [selectedCase]);

  const datePickerRef = React.useRef<IDatePicker>(null);

  return (
    <>
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
            disabled={isSubmitting}
          >
            Save as Draft
          </button>
          <button
            className={styles.savebtn}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
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
            render={({ field: f }) => (
              <div>
                <Dropdown
                  key={f.value ?? "empty"}
                  options={lovOptions["Tax Type"] || []}
                  selectedKey={f.value}
                  label="Tax Type"
                  onChange={(_, o) => f.onChange(o?.key)}
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
                    const activeCases = allCases.filter(
                      (item) =>
                        item.CaseStatus === "Active" ||
                        item.CaseStatus === "Approved"
                    );

                    if (selectedTaxType) {
                      const filtered = activeCases.filter(
                        (item) => item.TaxType === selectedTaxType
                      );
                      const prefix =
                        selectedTaxType === "Income Tax" ? "IT" : "ST";
                      setCaseOptions(
                        filtered.map((item) => {
                          const taxAuth = item.TaxAuthority || "N/A";
                          const caseNumberText = `${prefix}-${taxAuth}-${item.Id}`;
                          return {
                            key: item.Id,
                            text: caseNumberText,
                            data: item,
                          };
                        })
                      );
                    } else {
                      setCaseOptions(
                        activeCases.map((item) => {
                          const taxAuth = item.TaxAuthority || "N/A";
                          return {
                            key: item.Id,
                            text: `CN-${taxAuth}-${item.Id}`,
                            data: item,
                          };
                        })
                      );
                    }
                  } else {
                    // Filter case options based on input text
                    const filtered = caseOptions.filter((opt) =>
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
            render={({ field: f }) => (
              <Dropdown
                key={f.value ?? "empty"}
                label="GRS Code"
                options={lovOptions["GRS Code"] || []}
                selectedKey={f.value ?? undefined}
                onChange={(_, option) => {
                  if (f.value === option?.key) {
                    f.onChange(undefined);
                  } else {
                    f.onChange(option?.key as string);
                  }
                }}
                placeholder="Select"
              />
            )}
          />
          <Controller
            name="UTPCategory"
            control={control}
            render={({ field }) => (
              <Dropdown
                key={field.value ?? "empty"}
                label="UTP Category"
                options={lovOptions["UTP Category"] || []}
                selectedKey={field.value ?? undefined}
                onChange={(_, option) => {
                  if (field.value === option?.key) {
                    field.onChange(undefined);
                  } else {
                    field.onChange(option?.key as string);
                  }
                }}
                placeholder="Select"
                required
              />
            )}
          />

          <Controller
            name="ERMCategory"
            control={control}
            render={({ field }) => (
              <Dropdown
                key={field.value ?? "empty"}
                label="ERM Category"
                options={lovOptions["ERM Category"] || []}
                selectedKey={field.value ?? undefined}
                onChange={(_, option) => {
                  if (field.value === option?.key) {
                    field.onChange(undefined);
                  } else {
                    field.onChange(option?.key as string);
                  }
                }}
                placeholder="Select"
                required
              />
            )}
          />
          {/* <Controller
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
        /> */}

          {/* Row 3 */}
          {/* <Controller
          name="PLExposureExists"
          control={control}
          render={({ field }) => renderRadioGroup("P&L Exposure Exists", field)}
        /> */}
          {/* <Controller
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
        /> */}
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
          {/* {riskCategory === "Possible" && (
          <Controller
            name="ContigencyNote"
            control={control}
            rules={{
              required:
                "Contingency Note is required when Risk Category is Possible",
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
        )} */}
          {/* <Controller
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
          )} */}
          {/* /> */}
          {/* <Controller
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
                key={field.value ?? "empty"}
                label="Payment Type"
                options={lovOptions["Payment Type"] || []}
                selectedKey={field.value ?? undefined}
                onChange={(_, option) => {
                  if (field.value === option?.key) {
                    field.onChange(undefined);
                  } else {
                    field.onChange(option?.key as string);
                  }
                }}
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
                    width: "fit-content",
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
                        width: "fit-content",
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
                        width: "fit-content",
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

          {/* Row 7 - Date */}
          <Controller
            name="UTPDate"
            control={control}
            render={({ field }) => (
              <>
                <DatePicker
                  label="UTP Date"
                  value={field.value}
                  isRequired={true}
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
          <h3>UTP Issues</h3>
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
                label="UTP Issue"
                placeholder="Select UTP Issue"
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
              {entry.RiskCategory === "Possible" && (
                <Controller
                  name={`ContigencyNote_${idx}`}
                  control={control}
                  rules={{
                    required:
                      "Contingency Note is required when Risk Category is Possible",
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

              {/* Amount Contested */}
              <TextField
                label="Amount Contested"
                placeholder="Enter Amount"
                type="text"
                styles={{ root: { flex: 1 } }}
                value={
                  entry.amountContested !== undefined &&
                  entry.amountContested !== null
                    ? new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      }).format(entry.amountContested)
                    : ""
                }
                onChange={(_, v) => {
                  const numeric =
                    v?.replace(/,/g, "").replace(/[^0-9.]/g, "") || "";
                  const updated = [...taxIssueEntries];
                  updated[idx].amountContested = numeric
                    ? parseFloat(numeric)
                    : 0;
                  // recalc Gross Exposure
                  updated[idx].grossTaxExposure =
                    (updated[idx].amountContested || 0) *
                    (updated[idx].rate || 0);
                  setTaxIssueEntries(updated);
                }}
              />

              {/* Rate */}
              <TextField
                label="Rate"
                placeholder="Enter Rate"
                type="text"
                suffix="%"
                styles={{ root: { flex: 1 } }}
                value={
                  entry.rate !== undefined && entry.rate !== null
                    ? entry.rate.toString()
                    : ""
                }
                onChange={(_, v) => {
                  // only numeric input
                  const numeric =
                    v?.replace(/,/g, "").replace(/[^0-9.]/g, "") || "";
                  const updated = [...taxIssueEntries];
                  updated[idx].rate = numeric ? parseFloat(numeric) : 0;

                  // recalc Gross Exposure
                  updated[idx].grossTaxExposure =
                    (updated[idx].amountContested || 0) *
                    (updated[idx].rate || 0);
                  setTaxIssueEntries(updated);
                }}
              />

              {/* Gross Tax Exposure */}
              <TextField
                label="Gross Tax Exposure"
                readOnly
                value={entry.grossTaxExposure.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
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
                      RiskCategory: "",
                      contigencyNote: "",
                      amountContested: 0,
                      rate: 0,
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

export default UTPForm;
