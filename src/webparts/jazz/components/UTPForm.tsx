/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-lines */
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
import styles from "./Response.module.scss";
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
interface FormData {
  UTPId?: string;
  UTPDate: Date;
  GMLRID?: string;
  TaxType?: string;
  CaseNumber?: any;

  // Allow dynamic keys for your entries
  [
    key:
      | `Amount_${number}`
      | `ContigencyNote_${number}`
      | `GRSCode_${number}`
      | `UTPCategory_${number}`
      | `ERMCategory_${number}`
      | `ProvisionGLCode_${number}`
      | `PaymentGLCode_${number}`
  ]: any;
}

const UTPForm: React.FC<UTPFormProps> = ({
  SpfxContext,
  onCancel,
  onSave,
  selectedCase,
  loadUtpData,
}) => {
  const { control, handleSubmit, reset, getValues, watch, setValue } =
    useForm<FormData>({
      defaultValues: {
        UTPDate: new Date(), // initial default
      },

      mode: "onSubmit",
      shouldFocusError: true,
    });

  const [lovOptions, setLovOptions] = useState<{
    [key: string]: IDropdownOption[];
  }>({});
  const [attachments, setAttachments] = useState<AttachmentWithRename[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<
    ExistingAttachmentWithRename[]
  >([]);
  const [editingAttachment, setEditingAttachment] = useState<string | null>(
    null,
  );
  const [rateInputs, setRateInputs] = React.useState<{ [key: number]: string }>(
    {},
  );
  const [tempName, setTempName] = useState<string>("");
  const [caseOptions, setCaseOptions] = useState<IComboBoxOption[]>([]);
  const [allCases, setAllCases] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usedCaseNumbers, setUsedCaseNumbers] = React.useState<number[]>([]);
  const [caseError, setCaseError] = React.useState<string>("");
  const [taxIssueEntries, setTaxIssueEntries] = useState<
    {
      id: any;
      taxIssue: string;
      RiskCategory?: string;
      contigencyNote?: string;
      amountContested: number;
      rate: number;
      grossTaxExposure: number;
      amount: number;
      PaymentType?: string;
      EBITDA?: string;
      GRSCode?: string;
      ProvisionGLCode?: string;
      UTPCategory?: string;
      ERMCategory?: string;
      PaymentGLCode?: string;
    }[]
  >([]);

  const sp = spfi().using(SPFx(SpfxContext));
  const isEditMode = !!selectedCase;

  const selectedTaxType = watch("TaxType");
  useEffect(() => {
    (async () => {
      try {
        const utpItems = await sp.web.lists
          .getByTitle("UTPData")
          .items.select("Id", "CaseNumber/Id")
          .expand("CaseNumber")
          .top(5000)();

        const caseIds = utpItems
          .map((item) => item.CaseNumber?.Id)
          .filter((id) => !!id);

        setUsedCaseNumbers(caseIds);
      } catch (error) {
        console.error("Error fetching UTP items:", error);
      }
    })();
  }, []);

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
            "TaxAuthority",
            "ApprovalStatus",
          )
          .top(5000)(),
        sp.web.lists
          .getByTitle("LOVData1")
          .items.select("Id", "Title", "Value", "Status")
          .top(5000)(),
      ]);
      setAllCases(cases);
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
    // Filter active & approved cases (same as before)
    const approvedCases = allCases.filter((item) => {
      if (!item.TaxType) return false;
      const caseStatus = (item.CaseStatus || "").toLowerCase().trim();
      const approvalStatus = (item.ApprovalStatus || "").toLowerCase().trim();
      return caseStatus === "active" && approvalStatus === "approved";
    });

    // Keep latest per Title (same logic)
    const latestCasesMap = new Map<string, any>();
    approvedCases.forEach((item) => {
      const existing = latestCasesMap.get(item.Title);
      if (!existing || item.Id > existing.Id) {
        latestCasesMap.set(item.Title, item);
      }
    });
    const latestCases = Array.from(latestCasesMap.values());

    // Filter by TaxType if selected
    const filteredCases = selectedTaxType
      ? latestCases.filter((item) => item.TaxType === selectedTaxType)
      : latestCases;

    // Build options and normalize keys to string
    let builtOptions = (
      isEditMode
        ? filteredCases // show filtered cases in edit mode (or you used approvedCases previously; use whichever intended)
        : filteredCases.filter((item) => !usedCaseNumbers.includes(item.Id))
    ).map((item) => ({
      key: String(item.Id), // <-- IMPORTANT: string key
      text: item.Title,
      data: item,
    }));

    // If editing and selectedCase exists, ensure its CaseNumber option is present
    if (selectedCase) {
      const candidateKeys = [
        selectedCase?.CaseNumberId,
        selectedCase?.CaseNumber?.Id,
        selectedCase?.CaseNumber,
        selectedCase?.Id,
      ]
        .filter(Boolean)
        .map(String);

      const hasSelected = builtOptions.some((o) =>
        candidateKeys.includes(String(o.key)),
      );
      if (!hasSelected) {
        // inject the selectedCase as the first option (best-effort)
        const optKey = candidateKeys[0] || String(selectedCase.Id);
        builtOptions = [
          {
            key: optKey,
            text: selectedCase.CaseNumber?.Title || `Case ${optKey}`,
            data: selectedCase,
          },
          ...builtOptions,
        ];
      }
    }

    setCaseOptions(builtOptions);
  }, [selectedTaxType, allCases, usedCaseNumbers, isEditMode, selectedCase]);

  const selectedCaseNumberId = watch("CaseNumber");
  // let cachedNextId: number | null = null;

  // const getNextUTPIdNumber = async (sp: any): Promise<number> => {
  //   if (cachedNextId !== null) return cachedNextId;

  //   let retries = 3;
  //   let delay = 2000;

  //   while (retries > 0) {
  //     try {
  //       const items = await sp.web.lists
  //         .getByTitle("UTPData")
  //         .items.select("ID")
  //         .orderBy("ID", false)
  //         .top(1)();

  //       const lastId = items.length > 0 ? items[0].ID : 0;
  //       cachedNextId = lastId + 1;
  //       return cachedNextId ?? 1;
  //     } catch (err: any) {
  //       if (
  //         err.status === 429 || // too many requests
  //         err.status === 503 // service unavailable
  //       ) {
  //         console.warn(`SharePoint throttled, retrying in ${delay}ms`);
  //         await new Promise((res) => setTimeout(res, delay));
  //         retries--;
  //         delay *= 2; // exponential backoff
  //       } else {
  //         throw err;
  //       }
  //     }
  //   }

  //   // fallback if all retries fail
  //   return 1;
  // };
  const getLastUTPNumber = async () => {
    const items = await sp.web.lists
      .getByTitle("UTPData")
      .items.select("UTPId")
      .top(5000)(); // fetch all items or max needed

    let maxNumber = 0;

    items.forEach((item) => {
      if (item.UTPId) {
        // extract last number from pattern UTP-IT-FBR-123
        const match = item.UTPId.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      }
    });

    return maxNumber + 1;
  };

  useEffect(() => {
    const fetchNextIdAndSetUTPId = async () => {
      if (isEditMode) return;
      if (!selectedCaseNumberId) return;

      const caseId = Number(selectedCaseNumberId);
      const selectedCaseItem = allCases.find((c) => c.Id === caseId);
      if (!selectedCaseItem) return;

      const taxAuth = selectedCaseItem.TaxAuthority || "N/A";
      const taxtype = selectedCaseItem.TaxType === "Income Tax" ? "IT" : "ST";

      const nextId = await getLastUTPNumber();

      setValue("UTPId", `UTP-${taxtype}-${taxAuth}-${nextId}`);
    };

    fetchNextIdAndSetUTPId();
  }, [selectedCaseNumberId, allCases, setValue, isEditMode]);

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

  const saveAttachmentName = (id: string, isExisting: boolean = true) => {
    const extension = isExisting
      ? getFileExtension(
          existingAttachments.find((att) => att.ID === id)?.originalName || "",
        )
      : getFileExtension(
          attachments.find((att) => att.file.name === id)?.originalName || "",
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
            : att,
        ),
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
            : att,
        ),
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

      // derive the case number value and normalize to string if exists
      const rawCaseNumber =
        selectedCase?.CaseNumberId ??
        selectedCase?.CaseNumber?.Id ??
        selectedCase?.CaseNumber ??
        null;

      const caseNumberStr =
        rawCaseNumber !== null && rawCaseNumber !== undefined
          ? String(rawCaseNumber)
          : null;

      const prefilled: any = {
        TaxType: selectedCase.TaxType || "",
        GRSCode: selectedCase.GRSCode || "",
        UTPDate: selectedCase.UTPDate ? new Date(selectedCase.UTPDate) : null,
        CaseNumber: caseNumberStr,
        UTPId: selectedCase?.UTPId || null,
        GMLRID: selectedCase?.GMLRID || null,
      };

      // console.log(
      //   "Prefilling form: CaseNumber =",
      //   caseNumberStr,
      //   "caseOptions keys:",
      //   caseOptions.map((o) => o.key)
      // );

      // reset now — caseOptions already includes an injected option from the previous effect
      reset(prefilled);

      // fetch files & issues just like before
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
        })),
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
          "ContigencyNote",
          "Rate",
          "Amount",
          "PaymentType",
          "EBITDA",
          "GRSCode",
          "UTPCategory",
          "ERMCategory",
          "ProvisionGLCode",
          "PaymentGLCode",
        )();

      const mappedIssues = issues.map((item) => ({
        id: item.Id,
        taxIssue: item.Title,
        RiskCategory: item.RiskCategory,
        contigencyNote: item.ContigencyNote,
        rate: item.Rate,
        amountContested: item.AmountContested,
        grossTaxExposure: item.GrossTaxExposure,
        PaymentType: item.PaymentType,
        amount: item.Amount,
        EBITDA: item.EBITDA,
        GRSCode: item.GRSCode,
        UTPCategory: item.UTPCategory,
        ERMCategory: item.ERMCategory,
        ProvisionGLCode: item.ProvisionGLCode,
        PaymentGLCode: item.PaymentGLCode,
      }));

      setTaxIssueEntries(mappedIssues);
      const initialRates: { [id: number]: string } = {};
      mappedIssues.forEach((entry) => {
        if (entry.rate !== undefined && entry.rate !== null) {
          initialRates[entry.id] = Number(entry.rate).toFixed(2);
        }
      });
      setRateInputs(initialRates);
    };

    prefillForm();
  }, [selectedCase, caseOptions, reset]);

  const toNullIfEmpty = (val: any) => {
    if (val === undefined || val === null || val === "") return null;
    return val;
  };
  // 🔹 Get last used UTP number (based on previous UTPId)
  // const getLastUTPNumber = async () => {
  //   const items = await sp.web.lists
  //     .getByTitle("UTPData")
  //     .items.select("UTPId")
  //     .top(5000)(); // fetch all items or max needed

  //   let maxNumber = 0;

  //   items.forEach((item) => {
  //     if (item.UTPId) {
  //       // extract last number from pattern UTP-IT-FBR-123
  //       const match = item.UTPId.match(/(\d+)$/);
  //       if (match) {
  //         const num = parseInt(match[1], 10);
  //         if (num > maxNumber) maxNumber = num;
  //       }
  //     }
  //   });

  //   return maxNumber + 1;
  // };

  const submitForm = async (isDraft: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const shouldUpdateDraft =
      isEditMode &&
      selectedCase?.ID &&
      selectedCase?.ApprovalStatus === "Draft";

    try {
      const data = getValues();

      // 🔹 Build itemData safely
      const itemData: any = {
        IsDraft: isDraft,
        Status: isDraft ? "Draft" : "Pending",
        ApprovalStatus: isDraft ? "Draft" : "Pending",
        CaseNumberId: data.CaseNumber ? Number(data.CaseNumber) : null,
        // Choice/Text fields
        // UTPCategory: toNullIfEmpty(data.UTPCategory),
        TaxType: toNullIfEmpty(data.TaxType),
        // PaymentType: toNullIfEmpty(data.PaymentType),
        // ERMCategory: toNullIfEmpty(data.ERMCategory),
        // GRSCode: toNullIfEmpty(data.GRSCode),

        // Text fields
        // ERMUniqueNumbering: toNullIfEmpty(data.ERMUniqueNumbering),
        // PaymentGLCode: toNullIfEmpty(data.PaymentGLCode),
        // ProvisionGLCode: toNullIfEmpty(data.ProvisionGLCode),
        // Amount: data.Amount ? String(data.Amount) : null,

        // Other text field
        GMLRID: toNullIfEmpty(data.GMLRID),
      };

      // 🔹 Yes/No field
      if (data.TaxType === "Income Tax") {
        itemData.EBITDAExposureExists = true; // Yes
      } else if (data.TaxType === "Sales Tax") {
        itemData.EBITDAExposureExists = false; // No
      } else {
        itemData.EBITDAExposureExists = null;
      }

      // 🔹 Date field
      if (data.UTPDate) {
        const dateVal =
          data.UTPDate instanceof Date ? data.UTPDate : new Date(data.UTPDate);
        itemData.UTPDate = dateVal.toISOString();
      } else {
        itemData.UTPDate = null;
      }

      // 🔹 Save item

      let itemId: number;

      if (shouldUpdateDraft) {
        // 🔁 UPDATE existing draft (NO new item)
        await sp.web.lists
          .getByTitle("UTPData")
          .items.getById(selectedCase.ID)
          .update(itemData);

        itemId = selectedCase.ID;
      } else if (isEditMode && selectedCase?.ID) {
        // ➕ CREATE new version (Approved / Rejected edits)
        const result = await sp.web.lists.getByTitle("UTPData").items.add({
          ...itemData,
          UTPId: selectedCase.UTPId, // preserve UTPId
        });

        itemId = result.ID;
      } else {
        // ➕ BRAND NEW UTP
        const result = await sp.web.lists
          .getByTitle("UTPData")
          .items.add(itemData);

        itemId = result.ID;

        const nextNumber = await getLastUTPNumber();

        const selectedCaseItem = allCases.find(
          (c) => String(c.Id) === String(data.CaseNumber),
        );

        const taxAuth = selectedCaseItem?.TaxAuthority || "N/A";
        const taxtype =
          selectedCaseItem?.TaxType === "Income Tax"
            ? "IT"
            : selectedCaseItem?.TaxType === "Sales Tax"
              ? "ST"
              : "XX";

        const generatedUTPId = `UTP-${taxtype}-${taxAuth}-${nextNumber}`;

        await sp.web.lists.getByTitle("UTPData").items.getById(itemId).update({
          UTPId: generatedUTPId,
        });

        setValue("UTPId", generatedUTPId);
      }

      // 🔹 Batch: attachments + tax issues
      const [batchedSP, execute] = sp.batched();

      // Upload new attachments
      // 🔹 Process new attachments in parallel
      const attachmentPromises = attachments.map(async (attachment) => {
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

        return fileItem.update({ UTPId: itemId });
      });

      // 🔹 Process existing attachments in parallel
      const existingAttachmentPromises = existingAttachments.map(
        async (file) => {
          try {
            const blob = await sp.web
              .getFileByServerRelativePath(file.FileRef2 || file.FileRef)
              .getBlob();

            const finalFileName = file.isRenamed
              ? file.newName
              : file.FileLeafRef;

            const uploadResult: any = await sp.web.lists
              .getByTitle("Core Data Repositories")
              .rootFolder.files.addUsingPath(finalFileName, blob, {
                Overwrite: true,
              });

            const uploadedItem = await sp.web
              .getFileByServerRelativePath(uploadResult.ServerRelativeUrl)
              .getItem();

            return uploadedItem.update({ UTPId: itemId });
          } catch (err) {
            console.error("Failed to copy attachment:", err);
          }
        },
      );

      // Wait for all attachments together
      await Promise.all([...attachmentPromises, ...existingAttachmentPromises]);

      // Tax Issues
      taxIssueEntries.forEach((entry) => {
        const toNumberOrNull = (val: any) => {
          if (
            val === null ||
            val === undefined ||
            val === "" ||
            isNaN(Number(val))
          ) {
            return null;
          }
          return Number(val);
        };

        const amountContested = toNumberOrNull(entry.amountContested);
        const rate = toNumberOrNull(entry.rate);
        const grossTaxExposure = toNumberOrNull(entry.grossTaxExposure);
        const isUpdatingDraft = shouldUpdateDraft;

        if (entry.id && isUpdatingDraft) {
          batchedSP.web.lists
            .getByTitle("UTP Tax Issue")
            .items.getById(entry.id)
            .update({
              Title: entry.taxIssue,
              RiskCategory: entry.RiskCategory,
              ContigencyNote: entry.contigencyNote,
              AmountContested: amountContested,
              Rate: rate,
              GrossTaxExposure: grossTaxExposure,
              PaymentType: entry.PaymentType || null,
              Amount: entry.amount || null,
              EBITDA: entry.EBITDA || null,
              GRSCode: entry.GRSCode || null,
              ProvisionGLCode: entry.ProvisionGLCode || null,
              UTPCategory: entry.UTPCategory || null,
              ERMCategory: entry.ERMCategory || null,
              PaymentGLCode: entry.PaymentGLCode || null,
              UTPId: itemId,
            });
        } else {
          batchedSP.web.lists.getByTitle("UTP Tax Issue").items.add({
            Title: entry.taxIssue,
            RiskCategory: entry.RiskCategory,
            ContigencyNote: entry.contigencyNote,
            AmountContested: amountContested,
            Rate: rate,
            GrossTaxExposure: grossTaxExposure,
            PaymentType: entry.PaymentType || null,
            Amount: entry.amount || null,
            EBITDA: entry.EBITDA || null,
            GRSCode: entry.GRSCode || null,
            ProvisionGLCode: entry.ProvisionGLCode || null,
            UTPCategory: entry.UTPCategory || null,
            ERMCategory: entry.ERMCategory || null,
            PaymentGLCode: entry.PaymentGLCode || null,
            UTPId: itemId,
          });
        }
      });

      // Execute batch once
      await execute();

      // 🔹 Calculate Gross Exposure after batch
      const grossExposures = taxIssueEntries.map(
        (entry) => Number(entry.grossTaxExposure) || 0,
      );
      const totalGrossExposure = grossExposures.reduce(
        (sum, val) => sum + val,
        0,
      );

      await sp.web.lists.getByTitle("UTPData").items.getById(itemId).update({
        GrossExposure: totalGrossExposure,
      });

      // 🔹 Success
      toast.success(
        isDraft ? "Draft saved successfully" : "Case submitted successfully",
        {
          icon: "✅",
          style: {
            borderRadius: "10px",
            background: "#f0fff4",
            color: "#2f855a",
          },
        },
      );

      onSave(data);
      reset();
      setAttachments([]);
      setExistingAttachments([]);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Submit error", error);
      toast.error("Error submitting form", { icon: "⚠️" });
      setIsSubmitting(false);
    }
  };

  // const PaymentType = watch("PaymentType");

  useEffect(() => {
    const loadDefaults = async () => {
      if (!selectedCase) {
        const nextNumber = await getLastUTPNumber();

        reset({
          UTPId: `UTP-${nextNumber}`,
          UTPDate: new Date(),
        });
      }
    };

    loadDefaults();
  }, [selectedCase, reset]);

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
            onClick={handleSubmit(() => submitForm(true))}
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
            rules={{ required: "Tax Type is required" }}
            render={({ field: f, fieldState: { error } }) => (
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "100%",
                }}
              >
                <Dropdown
                  key={f.value ?? "empty"}
                  options={lovOptions["Tax Type"] || []}
                  selectedKey={f.value}
                  label="Tax Type"
                  onChange={(_, option) => {
                    if (f.value === option?.key) {
                      f.onChange(undefined);
                    } else {
                      f.onChange(option?.key as string);
                    }
                  }}
                  placeholder="Select"
                  required
                  styles={{
                    dropdown: { width: "100%" },
                  }}
                  errorMessage={error?.message}
                />

                {/* Cross Button */}
                {f.value && (
                  <button
                    type="button"
                    onClick={() => f.onChange(undefined)}
                    style={{
                      position: "absolute",
                      right: 22,
                      top: "70%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "#888",
                      lineHeight: 1,
                    }}
                  >
                    ✖
                  </button>
                )}
              </div>
            )}
          />

          <Controller
            name="CaseNumber"
            control={control}
            rules={{ required: "CaseNumber is required" }}
            render={({ field, fieldState: { error } }) => (
              <ComboBox
                label="Case Number"
                options={caseOptions}
                required
                disabled={isEditMode}
                selectedKey={field.value ? String(field.value) : undefined}
                onChange={(_, option) => {
                  if (option && usedCaseNumbers.includes(Number(option.key))) {
                    setCaseError(
                      "A UTP has already been created with this Case Number.",
                    );
                    field.onChange(undefined); // clear invalid selection
                    return;
                  }
                  setCaseError("");
                  field.onChange(option?.key);
                }}
                placeholder="Select Case Number"
                allowFreeform
                autoComplete="on"
                useComboBoxAsMenuWidth
                onInputValueChange={(newValue) => {
                  if (!newValue) {
                    const activeCases = allCases.filter((item) => {
                      if (!item.TaxType) return false;
                      const caseStatus = (item.CaseStatus || "")
                        .toLowerCase()
                        .trim();
                      const approvalStatus = (item.ApprovalStatus || "")
                        .toLowerCase()
                        .trim();
                      const isActive = caseStatus === "active";
                      const isApproved = approvalStatus === "approved";
                      return isActive && isApproved;
                    });

                    if (selectedTaxType) {
                      const filtered = activeCases.filter(
                        (item) => item.TaxType === selectedTaxType,
                      );
                      // const prefix =
                      // selectedTaxType === "Income Tax" ? "IT" : "ST";
                      setCaseOptions(
                        filtered.map((item) => {
                          // const taxAuth = item.TaxAuthority || "N/A";
                          // const caseNumberText = `${prefix}-${taxAuth}-${item.Id}`;
                          return {
                            key: item.Id,
                            text: item.Title,
                            data: item,
                          };
                        }),
                      );
                    } else {
                      setCaseOptions(
                        activeCases.map((item) => {
                          const taxAuth = item.TaxAuthority || "N/A";
                          const taxtype =
                            item.TaxType === "Income Tax" ? "IT" : "ST";
                          return {
                            key: item.Id,
                            text: `${taxtype}-${taxAuth}-${item.Id}`,
                            data: item,
                          };
                        }),
                      );
                    }
                  } else {
                    const filtered = caseOptions.filter((opt) =>
                      opt.text.toLowerCase().includes(newValue.toLowerCase()),
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
                errorMessage={error?.message || caseError}
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
            render={({ field, fieldState }) => (
              <TextField
                label="GMLR ID"
                placeholder="Enter Value"
                {...field}
                errorMessage={fieldState.error?.message}
              />
            )}
          />

          {/* Row 2 */}
          {/* <Controller
            name="GRSCode"
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
                {f.value && (
                  <button
                    type="button"
                    onClick={() => f.onChange(undefined)}
                    style={{
                      position: "absolute",
                      right: 22,
                      top: "70%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "#888",
                      lineHeight: 1,
                    }}
                  >
                    ✖
                  </button>
                )}
              </div>
            )}
          /> */}

          {/* <Controller
            name="UTPCategory"
            control={control}
            rules={{ required: "UTP Category is required" }}
            render={({ field, fieldState: { error } }) => (
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "100%",
                }}
              >
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
                  errorMessage={error?.message}
                />
                {field.value && (
                  <button
                    type="button"
                    onClick={() => field.onChange(undefined)}
                    style={{
                      position: "absolute",
                      right: 22,
                      top: "70%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "#888",
                      lineHeight: 1,
                    }}
                  >
                    ✖
                  </button>
                )}
              </div>
            )}
          />

          <Controller
            name="ERMCategory"
            control={control}
            rules={{ required: "ERM Category is required" }}
            render={({ field, fieldState: { error } }) => (
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "100%",
                }}
              >
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
                  errorMessage={error?.message}
                />
                {field.value && (
                  <button
                    type="button"
                    onClick={() => field.onChange(undefined)}
                    style={{
                      position: "absolute",
                      right: 22,
                      top: "70%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "#888",
                      lineHeight: 1,
                    }}
                  >
                    ✖
                  </button>
                )}
              </div>
            )}
          />

          <Controller
            name="PaymentGLCode"
            control={control}
            rules={{ required: " is required" }}
            render={({ field, fieldState: { error } }) => (
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "100%",
                }}
              >
                <Dropdown
                  key={field.value ?? "empty"}
                  label="Payment GL Code"
                  options={lovOptions["Payment GL Code"] || []}
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
                  errorMessage={error?.message}
                />
                {field.value && (
                  <button
                    type="button"
                    onClick={() => field.onChange(undefined)}
                    style={{
                      position: "absolute",
                      right: 22,
                      top: "70%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "#888",
                      lineHeight: 1,
                    }}
                  >
                    ✖
                  </button>
                )}
              </div>
            )}
          /> */}

          {/* <Controller
            name="ProvisionGLCode"
            control={control}
            rules={{ required: "Provision GL Code is required" }}
            render={({ field, fieldState: { error } }) => (
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "100%",
                }}
              >
                <Dropdown
                  key={field.value ?? "empty"}
                  label="Provision GL Code"
                  options={lovOptions["Provision GL Code"] || []}
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
                  errorMessage={error?.message}
                />
                {field.value && (
                  <button
                    type="button"
                    onClick={() => field.onChange(undefined)}
                    style={{
                      position: "absolute",
                      right: 22,
                      top: "70%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "#888",
                      lineHeight: 1,
                    }}
                  >
                    ✖
                  </button>
                )}
              </div>
            )}
          /> */}
          {/* <Controller
            name="PaymentGLCode"
            control={control}
            render={({ field }) => (
              <TextField
                label="Payment GL Code"
                placeholder="Enter Value"
                {...field}
              />
            )}
          />
          <Controller
            name="ProvisionGLCode"
            control={control}
            render={({ field }) => (
              <TextField
                label="Provision GL Code"
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

          {/* <Controller
            name="ERMUniqueNumbering"
            control={control}
            render={({ field }) => (
              <TextField
                label="ERM Unique Numbering"
                placeholder="Enter Number"
                {...field}
              />
            )}
          /> */}
          {/* <Controller
            name="PaymentType"
            control={control}
            render={({ field, fieldState }) => (
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "100%",
                }}
              >
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
                  errorMessage={fieldState.error?.message}
                />
                {field.value && (
                  <button
                    type="button"
                    onClick={() => field.onChange(undefined)}
                    style={{
                      position: "absolute",
                      right: 22,
                      top: "70%", // ✅ center aligned
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "#888",
                      lineHeight: 1,
                    }}
                  >
                    ✖
                  </button>
                )}
              </div>
            )}
          />
          {PaymentType && (
            <Controller
              name="Amount"
              control={control}
              rules={{
                required: "Amount is required when Payment Type is selected",
              }}
              render={({ field, fieldState }) => (
                <TextField
                  label="Amount"
                  placeholder="Enter Amount"
                  value={
                    field.value
                      ? new Intl.NumberFormat("en-US").format(
                          Number(field.value)
                        )
                      : ""
                  }
                  onChange={(e, newValue) => {
                    // Remove all commas before saving raw number
                    const rawValue = newValue?.replace(/,/g, "") || "";
                    // Allow only numbers
                    if (/^\d*$/.test(rawValue)) {
                      field.onChange(rawValue);
                    }
                  }}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
          )} */}

          {/* Row 6 - Attachments */}
          <div style={{ display: "contents" }}>
            <div style={{ gridColumn: "span 1" }}>
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
                      }),
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
                      maxWidth: "100%",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setExistingAttachments((prev) =>
                          prev.filter((att) => att.ID !== file.ID),
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
                      width: "fit-content",
                      maxWidth: "100%",
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
                              attachment.newName,
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
            <Controller
              name="UTPDate"
              control={control}
              rules={{ required: "UTP Date is required" }}
              render={({ field, fieldState }) => (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    marginTop: 0,
                  }}
                >
                  <DatePicker
                    label="UTP Date"
                    value={field.value ?? null}
                    isRequired={true}
                    calloutProps={{
                      preventDismissOnScroll: true,
                      // Ensures calendar stays fixed to viewport
                      doNotLayer: false,
                      // Keeps focus within popup to stop layout shift
                      setInitialFocus: true,
                    }}
                    onSelectDate={(date) => {
                      if (date) {
                        field.onChange(date ?? null);
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
                    styles={{
                      root: { width: "100%" },
                      textField: {
                        selectors: {
                          ".ms-TextField-fieldGroup": {
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            position: "relative",
                            paddingRight: "28px", // space for ❌ icon
                          },
                          ".ms-TextField-field": {
                            paddingRight: "28px", // ensure text doesn't overlap icon
                          },
                        },
                      },
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />

                  {/* ❌ Clear button inside the field */}
                  {field.value && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => field.onChange(null)}
                      style={{
                        position: "absolute",
                        right: "30px",
                        top: "50px",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "#888",
                        lineHeight: 1,
                        padding: 0,
                        zIndex: 3,
                      }}
                    >
                      ✖
                    </button>
                  )}
                  {/* {fieldState.error && (
                    <span style={{ color: "red" }}>
                      {fieldState.error.message}
                    </span>
                  )} */}

                  {/* Dialog for previous-month selection */}
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
                </div>
              )}
            />
          </div>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            UTP Issues
          </h3>

          {taxIssueEntries.map((entry, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
                background: "#f9fafb",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "0.75rem 1rem",
                  alignItems: "end",
                }}
              >
                {/* UTP Issue (no clear button) */}
                <div>
                  <Dropdown
                    label="UTP Issue"
                    placeholder="Select UTP Issue"
                    options={lovOptions["Tax Issue"] || []}
                    selectedKey={entry.taxIssue}
                    onChange={(_, o) => {
                      const updated = [...taxIssueEntries];
                      updated[idx].taxIssue = (o?.key as string) || "";
                      setTaxIssueEntries(updated);
                    }}
                  />
                </div>

                {/* Risk Category */}
                <div style={{ position: "relative" }}>
                  <Dropdown
                    label="Risk Category"
                    selectedKey={entry.RiskCategory}
                    placeholder="Select Risk Category"
                    required
                    options={lovOptions["Risk Category"] || []}
                    onChange={(_, option) => {
                      const updated = [...taxIssueEntries];
                      updated[idx].RiskCategory = (option?.key as string) || "";
                      if (updated[idx].RiskCategory !== "Possible") {
                        updated[idx].contigencyNote = "";
                      }
                      setTaxIssueEntries(updated);
                    }}
                  />
                  {entry.RiskCategory && (
                    <span
                      title="Clear selection"
                      onClick={() => {
                        const updated = [...taxIssueEntries];
                        updated[idx].RiskCategory = "";
                        updated[idx].contigencyNote = "";
                        setTaxIssueEntries(updated);
                      }}
                      style={{
                        position: "absolute",
                        right: "25px",
                        top: "30px",
                        cursor: "pointer",
                        color: "#888",
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      ×
                    </span>
                  )}
                </div>

                {/* Contingency Note */}
                {entry.RiskCategory === "Possible" && (
                  <div>
                    <Controller
                      name={`ContigencyNote_${idx}`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          label="Contingency Note"
                          value={entry.contigencyNote || ""}
                          onChange={(_, newValue) => {
                            const updated = [...taxIssueEntries];
                            updated[idx].contigencyNote = newValue || "";
                            setTaxIssueEntries(updated);
                            f.onChange(newValue);
                          }}
                        />
                      )}
                    />
                  </div>
                )}

                {/* Amount Contested */}
                <div>
                  <TextField
                    label="Amount Contested"
                    placeholder="Enter Amount"
                    type="text"
                    value={
                      entry.amountContested
                        ? new Intl.NumberFormat("en-US").format(
                            entry.amountContested,
                          )
                        : ""
                    }
                    onChange={(_, v) => {
                      const numericValue =
                        v?.replace(/,/g, "").replace(/[^0-9.]/g, "") || "";
                      const updated = [...taxIssueEntries];
                      updated[idx].amountContested = numericValue
                        ? parseFloat(numericValue)
                        : 0;
                      const rateVal = updated[idx].rate ?? 0;
                      updated[idx].grossTaxExposure =
                        (updated[idx].amountContested || 0) * (rateVal / 100);
                      setTaxIssueEntries(updated);
                    }}
                  />
                </div>

                {/* Rate (%) */}
                <div>
                  <TextField
                    label="Rate (%)"
                    placeholder="Enter Rate"
                    value={
                      rateInputs[idx] !== undefined
                        ? rateInputs[idx]
                        : entry.rate !== undefined && entry.rate !== null
                          ? String(entry.rate)
                          : ""
                    }
                    onChange={(_, v) => {
                      const cleaned = v?.replace(/[^0-9.]/g, "") || "";
                      const singleDot = cleaned.replace(/(\..*)\./g, "$1");
                      setRateInputs((prev) => ({ ...prev, [idx]: singleDot }));

                      const parsed = parseFloat(singleDot);
                      const updated = [...taxIssueEntries];
                      updated[idx].rate = isNaN(parsed) ? 0 : parsed;
                      updated[idx].grossTaxExposure =
                        (updated[idx].amountContested || 0) *
                        ((isNaN(parsed) ? 0 : parsed) / 100);
                      setTaxIssueEntries(updated);
                    }}
                  />
                </div>

                {/* Gross Tax Exposure */}
                <div>
                  <TextField
                    label="Gross Tax Exposure"
                    readOnly
                    value={
                      entry.grossTaxExposure
                        ? new Intl.NumberFormat("en-US").format(
                            entry.grossTaxExposure,
                          )
                        : ""
                    }
                  />
                </div>

                {/* Payment Type */}
                <div style={{ position: "relative", minWidth: 0 }}>
                  <Dropdown
                    label="Payment Type"
                    placeholder="Select Payment Type"
                    options={lovOptions["Payment Type"] || []}
                    selectedKey={entry.PaymentType}
                    onChange={(_, o) => {
                      const updated = [...taxIssueEntries];
                      updated[idx].PaymentType = (o?.key as string) || "";
                      if (!updated[idx].PaymentType) {
                        updated[idx].amount = 0;
                      }
                      setTaxIssueEntries(updated);
                    }}
                  />
                  {entry.PaymentType && (
                    <span
                      title="Clear selection"
                      onClick={() => {
                        const updated = [...taxIssueEntries];
                        updated[idx].PaymentType = "";
                        updated[idx].amount = 0;
                        setTaxIssueEntries(updated);
                      }}
                      style={{
                        position: "absolute",
                        right: "25px",
                        top: "30px",
                        cursor: "pointer",
                        color: "#888",
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      ×
                    </span>
                  )}
                </div>
                {entry.PaymentType && (
                  <Controller
                    name={`Amount_${idx}`}
                    control={control}
                    rules={{
                      required:
                        "Amount is required when Payment Type is selected",
                    }}
                    render={({ field: f, fieldState: { error } }) => (
                      <TextField
                        label="Amount"
                        required
                        errorMessage={error?.message}
                        value={
                          entry.amount !== undefined && entry.amount !== null
                            ? entry.amount.toLocaleString("en-US")
                            : ""
                        }
                        onChange={(_, newValue) => {
                          const rawValue =
                            newValue?.replace(/[^0-9]/g, "") || "";
                          const numericValue = rawValue ? Number(rawValue) : 0;
                          const updated = [...taxIssueEntries];
                          updated[idx].amount = numericValue;
                          setTaxIssueEntries(updated);
                          f.onChange(numericValue);
                        }}
                      />
                    )}
                  />
                )}

                {/* EBITDA */}
                <div style={{ position: "relative" }}>
                  <Dropdown
                    label="EBITDA"
                    placeholder="Select EBITDA"
                    options={lovOptions["EBITDA"] || []}
                    selectedKey={entry.EBITDA}
                    onChange={(_, option) => {
                      const updated = [...taxIssueEntries];
                      updated[idx].EBITDA = (option?.key as string) || "";
                      setTaxIssueEntries(updated);
                    }}
                  />
                  {entry.EBITDA && (
                    <span
                      title="Clear selection"
                      onClick={() => {
                        const updated = [...taxIssueEntries];
                        updated[idx].EBITDA = "";
                        setTaxIssueEntries(updated);
                      }}
                      style={{
                        position: "absolute",
                        right: "25px",
                        top: "30px",
                        cursor: "pointer",
                        color: "#888",
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      ×
                    </span>
                  )}
                </div>

                {/* GRS Code (already had ×) */}
                {entry.RiskCategory === "Probable" && (
                  <div style={{ position: "relative" }}>
                    <Controller
                      name={`GRSCode_${idx}`}
                      control={control}
                      render={({ field: f }) => (
                        <>
                          <Dropdown
                            label="GRS Code"
                            options={lovOptions["GRS Code"] || []}
                            selectedKey={entry.GRSCode ?? undefined}
                            onChange={(_, option) => {
                              const updated = [...taxIssueEntries];
                              updated[idx].GRSCode =
                                (option?.key as string) || "";
                              setTaxIssueEntries(updated);
                              f.onChange(option?.key);
                            }}
                            placeholder="Select"
                          />
                          {entry.GRSCode && (
                            <span
                              title="Clear selection"
                              onClick={() => {
                                const updated = [...taxIssueEntries];
                                updated[idx].GRSCode = "";
                                setTaxIssueEntries(updated);
                                f.onChange("");
                              }}
                              style={{
                                position: "absolute",
                                right: "25px",
                                top: "30px",
                                cursor: "pointer",
                                color: "#888",
                                fontSize: "18px",
                                fontWeight: "bold",
                              }}
                            >
                              ×
                            </span>
                          )}
                        </>
                      )}
                    />
                  </div>
                )}

                {/* Provision GL Code */}
                {entry.RiskCategory === "Probable" && (
                  <div style={{ position: "relative" }}>
                    <Controller
                      name={`ProvisionGLCode_${idx}`}
                      control={control}
                      render={({ field: f }) => (
                        <>
                          <Dropdown
                            label="Provision GL Code"
                            options={lovOptions["Provision GL Code"] || []}
                            selectedKey={entry.ProvisionGLCode ?? undefined}
                            onChange={(_, option) => {
                              const updated = [...taxIssueEntries];
                              updated[idx].ProvisionGLCode =
                                (option?.key as string) || "";
                              setTaxIssueEntries(updated);
                              f.onChange(option?.key);
                            }}
                            placeholder="Select"
                          />
                          {entry.ProvisionGLCode && (
                            <span
                              title="Clear selection"
                              onClick={() => {
                                const updated = [...taxIssueEntries];
                                updated[idx].ProvisionGLCode = "";
                                setTaxIssueEntries(updated);
                                f.onChange("");
                              }}
                              style={{
                                position: "absolute",
                                right: "25px",
                                top: "30px",
                                cursor: "pointer",
                                color: "#888",
                                fontSize: "18px",
                                fontWeight: "bold",
                              }}
                            >
                              ×
                            </span>
                          )}
                        </>
                      )}
                    />
                  </div>
                )}

                {/* UTP Category */}
                <div style={{ position: "relative" }}>
                  <Controller
                    name={`UTPCategory_${idx}`}
                    control={control}
                    render={({ field: f }) => (
                      <>
                        <Dropdown
                          label="UTP Category"
                          options={lovOptions["UTP Category"] || []}
                          selectedKey={entry.UTPCategory ?? undefined}
                          onChange={(_, option) => {
                            const updated = [...taxIssueEntries];
                            updated[idx].UTPCategory =
                              (option?.key as string) || "";
                            setTaxIssueEntries(updated);
                            f.onChange(option?.key);
                          }}
                          placeholder="Select"
                        />
                        {entry.UTPCategory && (
                          <span
                            title="Clear selection"
                            onClick={() => {
                              const updated = [...taxIssueEntries];
                              updated[idx].UTPCategory = "";
                              setTaxIssueEntries(updated);
                              f.onChange("");
                            }}
                            style={{
                              position: "absolute",
                              right: "25px",
                              top: "30px",
                              cursor: "pointer",
                              color: "#888",
                              fontSize: "18px",
                              fontWeight: "bold",
                            }}
                          >
                            ×
                          </span>
                        )}
                      </>
                    )}
                  />
                </div>

                {/* ERM Category */}
                <div style={{ position: "relative" }}>
                  <Controller
                    name={`ERMCategory_${idx}`}
                    control={control}
                    render={({ field: f }) => (
                      <>
                        <Dropdown
                          label="ERM Category"
                          options={lovOptions["ERM Category"] || []}
                          selectedKey={entry.ERMCategory ?? undefined}
                          onChange={(_, option) => {
                            const updated = [...taxIssueEntries];
                            updated[idx].ERMCategory =
                              (option?.key as string) || "";
                            setTaxIssueEntries(updated);
                            f.onChange(option?.key);
                          }}
                          placeholder="Select"
                        />
                        {entry.ERMCategory && (
                          <span
                            title="Clear selection"
                            onClick={() => {
                              const updated = [...taxIssueEntries];
                              updated[idx].ERMCategory = "";
                              setTaxIssueEntries(updated);
                              f.onChange("");
                            }}
                            style={{
                              position: "absolute",
                              right: "25px",
                              top: "30px",
                              cursor: "pointer",
                              color: "#888",
                              fontSize: "18px",
                              fontWeight: "bold",
                            }}
                          >
                            ×
                          </span>
                        )}
                      </>
                    )}
                  />
                </div>

                {/* Payment GL Code */}
                {entry.PaymentType && (
                  <div style={{ position: "relative" }}>
                    <Controller
                      name={`PaymentGLCode_${idx}`}
                      control={control}
                      render={({ field: f }) => (
                        <>
                          <Dropdown
                            label="Payment GL Code"
                            options={lovOptions["Payment GL Code"] || []}
                            selectedKey={entry.PaymentGLCode ?? undefined}
                            onChange={(_, option) => {
                              const updated = [...taxIssueEntries];
                              updated[idx].PaymentGLCode =
                                (option?.key as string) || "";
                              setTaxIssueEntries(updated);
                              f.onChange(option?.key);
                            }}
                            placeholder="Select"
                          />
                          {entry.PaymentGLCode && (
                            <span
                              title="Clear selection"
                              onClick={() => {
                                const updated = [...taxIssueEntries];
                                updated[idx].PaymentGLCode = "";
                                setTaxIssueEntries(updated);
                                f.onChange("");
                              }}
                              style={{
                                position: "absolute",
                                right: "25px",
                                top: "30px",
                                cursor: "pointer",
                                color: "#888",
                                fontSize: "18px",
                                fontWeight: "bold",
                              }}
                            >
                              ×
                            </span>
                          )}
                        </>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Remove Issue Button */}
              <div style={{ textAlign: "right", marginTop: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...taxIssueEntries];
                    updated.splice(idx, 1);
                    setTaxIssueEntries(updated);
                    setRateInputs((prev) => {
                      const copy = { ...prev };
                      delete copy[idx];
                      return copy;
                    });
                  }}
                  style={{
                    background: "#fee2e2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  ❌ Remove Issue
                </button>
              </div>
            </div>
          ))}

          {/* Add New Issue button */}
          <div style={{ textAlign: "left" }}>
            <button
              type="button"
              onClick={() => {
                const used = taxIssueEntries.map((t) => t.taxIssue);
                const available = (lovOptions["Tax Issue"] || []).find(
                  (opt) => !used.includes(opt.key as string),
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
                      PaymentType: "",
                      amount: 0,
                      EBITDA: "",
                      GRSCode: "",
                      ProvisionGLCode: "",
                      UTPCategory: "",
                      ERMCategory: "",
                      PaymentGLCode: "",
                    },
                  ]);
                  // initialize rateInputs for new row
                  setRateInputs((prev) => ({
                    ...prev,
                    [taxIssueEntries.length]: "0.00",
                  }));
                }
              }}
              style={{
                marginTop: "0.5rem",
                padding: "0.6rem 1.2rem",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              ➕ Add New Issue
            </button>
          </div>
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
