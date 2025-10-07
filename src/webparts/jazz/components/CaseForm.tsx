/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable prefer-const */
/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/attachments";
import "@pnp/sp/batching";
import "react-datepicker/dist/react-datepicker.css";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { TextField } from "@fluentui/react/lib/TextField";
import { DatePicker, IDatePicker } from "@fluentui/react/lib/DatePicker";
// import { IconButton } from "@fluentui/react/lib/Button";
import styles from "./CaseForm.module.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./DatePickerWithClear.css";
// import {
//   PeoplePicker,
//   PrincipalType,
// } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { ComboBox, IComboBox, IComboBoxOption } from "@fluentui/react";
toast.configure();
interface CaseFormProps {
  onCancel: () => void;
  onSave: (data: any) => void;
  SpfxContext: any;
  selectedCase?: any;
  notiID?: any;
  loadCasesData: any;
  existing?: any;
  setExisting: any;
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
const CaseForm: React.FC<CaseFormProps> = ({
  SpfxContext,
  onCancel,
  loadCasesData,
  onSave,
  selectedCase,
  notiID,
  existing,
  setExisting,
}) => {
  const { control, handleSubmit, reset, getValues, setValue } = useForm({});
  const taxType = useWatch({ control, name: "TaxType" });
  const taxAuthority = useWatch({ control, name: "TaxAuthority" });

  const [lovOptions, setLovOptions] = useState<{
    [key: string]: IDropdownOption[];
  }>({});
  const [casesOptions, setCasesOptions] = React.useState<IComboBoxOption[]>([]);
  const [attachments, setAttachments] = useState<AttachmentWithRename[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<
    ExistingAttachmentWithRename[]
  >([]);
  const [editingAttachment, setEditingAttachment] = useState<string | null>(
    null
  );
  const [caseSearch, setCaseSearch] = useState("");
  const [taxConsultantOptions, setTaxConsultantOptions] = useState<any[]>([]);
  const [lawyerOptions, setLawyerOptions] = useState<any[]>([]);
  const [tempName, setTempName] = useState<string>("");
  // const [isFinancialOpen, setIsFinancialOpen] = React.useState(false);
  const [taxIssueEntries, setTaxIssueEntries] = useState<
    {
      id: any;
      taxIssue: string;
      amountContested: number;
      rate: number;
      grossTaxExposure: number;
    }[]
  >([]);
  const [nextCaseNumber, setNextCaseNumber] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateInputs, setRateInputs] = React.useState<{ [key: number]: string }>(
    {}
  );
  // const [isNewCaseFromNotification, setIsNewCaseFromNotification] =
  // useState(false);

  const sp = spfi().using(SPFx(SpfxContext));

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

  const getCaseNumberPrefix = React.useCallback(() => {
    let prefix = "CN";
    if (taxType === "Income Tax") prefix = "IT";
    else if (taxType === "Sales Tax") prefix = "ST";
    const authorityPart = taxAuthority ? `-${taxAuthority}` : "";
    return `${prefix}${authorityPart}-`;
  }, [taxType, taxAuthority]);

  const fieldMapping: { [key: string]: string } = {
    "Tax Type": "TaxType",
    Entity: "Entity",
    "Tax Authority": "TaxAuthority",
    "Correspondence Type": "CorrespondenceType",
    "Issued By": "IssuedBy",
    "Pending Authority": "PendingAuthority",
    "Tax Consultant Assigned": "TaxConsultantAssigned",
    "Lawyer Assigned": "LawyerAssigned0",
    "Exposure Issues": "Exposure_x0020_Issues",
    "Financial Year": "FinancialYear",
    "Tax Year": "TaxYear",
    "Stay Expiring On": "StayExpiringOn",
  };

  const dropdownFields = Object.keys(fieldMapping);
  const inputFields = [
    { label: "Document Reference Number", name: "DocumentReferenceNumber" },
    { label: "Email – Title", name: "Email" },
  ];

  const dateFields = [
    { label: "Date of Document", name: "Dateofdocument" },
    { label: "Date Received", name: "DateReceived" },
    { label: "Date of Compliance", name: "DateofCompliance" },
    { label: "Stay Expiring On", name: "StayExpiringOn" },
    { label: "Hearing Date", name: "Hearingdate" },
  ];

  const multilineFields = [
    { label: "SCN/Order Summary", name: "OrderSummary" },
    { label: "Brief Description", name: "BriefDescription" },
  ];

  const fieldOrder = [
    { type: "dropdown", label: "Tax Type", name: "TaxType" },
    { type: "dropdown", label: "Tax Authority" },
    { type: "caseNumber", label: "Case Number" },
    { type: "dropdown", label: "Entity" },
    {
      type: "input",
      label: "Document Reference Number",
      name: "DocumentReferenceNumber",
    },
    { type: "dropdown", label: "Correspondence Type" },
    { type: "dropdown", label: "Issued By" },
    { type: "date", label: "Date of Document", name: "Dateofdocument" },
    { type: "date", label: "Date Received", name: "DateReceived" },
    { type: "dropdown", label: "Financial Year" },
    { type: "dropdown", label: "Tax Year" },
    { type: "dropdown", label: "Pending Authority" },
    { type: "date", label: "Date of Compliance", name: "DateofCompliance" },
    { type: "date", label: "Hearing Date", name: "Hearingdate" },
    { type: "date", label: "Stay Expiring On", name: "StayExpiringOn" },
    { type: "dropdown", label: "Tax Consultant Assigned" },
    { type: "dropdown", label: "Lawyer Assigned" },
    { type: "dropdown", label: "Exposure Issues" },
    { type: "input", label: "Email – Title", name: "Email" },
  ];
  useEffect(() => {
    (async () => {
      const items = await sp.web.lists
        .getByTitle("Tax Consultant")
        .items.select("Id", "Title", "Email", "Status")();

      const options = items
        .filter((item) => item.Status === "Active")
        .map((item) => ({
          key: item.Title,
          text: item.Title,
          data: { email: item.Email },
        }));

      setTaxConsultantOptions(options);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const items = await sp.web.lists
        .getByTitle("Lawyer Assigned")
        .items.select("Id", "Title", "Email", "Status")();
      const options = items
        .filter((item) => item.Status === "Active")
        .map((item) => ({
          key: item.Title,
          text: item.Title,
          data: { email: item.Email },
        }));
      setLawyerOptions(options);
    })();
  }, []);

  const getYearOptions = (): IComboBoxOption[] => {
    const currentYear = new Date().getFullYear();
    const years: IComboBoxOption[] = [];
    for (let y = currentYear; y >= 1980; y--) {
      years.push({ key: "FY" + y.toString(), text: "FY" + y.toString() });
    }
    return years;
  };

  const getTaxYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years: IComboBoxOption[] = [];
    for (let i = currentYear + 1; i >= 1980; i--) {
      years.push({
        key: i.toString(),
        text: i.toString(),
      });
    }
    return years;
  };
  const allFinancialYears = React.useMemo(() => getYearOptions(), []);
  const allTaxYears = React.useMemo(() => getTaxYearOptions(), []);
  const [financialYearOptions, setFinancialYearOptions] =
    React.useState<IComboBoxOption[]>(allFinancialYears);
  const [taxYearOptions, setTaxYearOptions] =
    React.useState<IComboBoxOption[]>(allTaxYears);

  const handleFinancialYearInputChange = (value: string) => {
    const filtered = allFinancialYears.filter((o) =>
      o.text.toLowerCase().includes(value.toLowerCase())
    );
    setFinancialYearOptions(filtered.length > 0 ? filtered : allFinancialYears);
  };

  const handleTaxYearInputChange = (value: string) => {
    const filtered = allTaxYears.filter((o) =>
      o.text.toLowerCase().includes(value.toLowerCase())
    );
    setTaxYearOptions(filtered.length > 0 ? filtered : allTaxYears);
  };

  //  useEffect(() => {
  //    const fetchLOVsAndCases = async () => {
  //      // 🔹 Fetch LOVs and filter Active
  //      const lovItems = await sp.web.lists
  //        .getByTitle("LOVData1")
  //        .items.select(
  //          "Id",
  //          "Title",
  //          "Value",
  //          "Status",
  //          "Parent/Id",
  //          "Parent/Title",
  //          "Parent/Value"
  //        )
  //        .expand("Parent")();

  //      const activeLOVs = lovItems.filter((item) => item.Status === "Active");
  //      const grouped: {
  //        [key: string]: {
  //          key: number;
  //          text: string;
  //          parentId?: number;
  //          parentValue?: string;
  //        }[];
  //      } = {};

  //      activeLOVs.forEach((item) => {
  //        if (!grouped[item.Title]) grouped[item.Title] = [];
  //        grouped[item.Title].push({
  //          key: item.Id,
  //          text: item.Value,
  //          parentId: item.Parent?.Id || null,
  //          parentValue: item.Parent?.Value || null,
  //        });
  //      });
  //      console.log("Grouped LOV Options:", grouped);
  //      setLovOptions(grouped);

  //      // 🔹 Fetch only Active Cases
  //      const caseItems = await sp.web.lists
  //        .getByTitle("Cases")
  //        .items.select("ID", "Title", "TaxType", "CaseStatus")(); // 👈 include Status

  //      const activeCases = caseItems.filter(
  //        (item) => item.CaseStatus === "Active"
  //      ); // 👈 filter

  //      const options: IComboBoxOption[] = activeCases.map((item) => ({
  //        key: item.ID.toString(),
  //        text:
  //          item.TaxType === "Income Tax"
  //            ? `IT-${item.ID.toString().padStart(4, "0")}`
  //            : item.TaxType === "Sales Tax"
  //            ? `ST-${item.ID.toString().padStart(4, "0")}`
  //            : `CN-${item.ID.toString().padStart(4, "0")}`,
  //        data: { taxType: item.TaxType },
  //      }));

  //      setCasesOptions(options);
  //    };

  //    fetchLOVsAndCases();
  //  }, []);

  useEffect(() => {
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

    fetchLOVs();

    sp.web.lists
      .getByTitle("Cases")
      .items.select(
        "ID",
        "Title",
        "TaxType",
        "CaseStatus",
        "TaxAuthority",
        "ApprovalStatus"
      )()
      .then((items) => {
        const options: IComboBoxOption[] = items
          .filter(
            (item) =>
              item.CaseStatus === "Active" && item.ApprovalStatus === "Approved"
          )
          .map((item) => ({
            key: item.ID.toString(),
            text: item.Title,
            data: {
              taxType: item.TaxType,
              taxAuthority: item.TaxAuthority,
            },
          }));
        setCasesOptions(options);
      });
  }, []);

  // filter by Tax Type
  const filteredCaseOptions = React.useMemo(() => {
    let filtered = casesOptions;

    if (taxType) {
      filtered = filtered.filter((opt) => opt.data?.taxType === taxType);
    }

    if (caseSearch) {
      const searchLower = caseSearch.toLowerCase();
      filtered = filtered.filter((opt) =>
        opt.text?.toString().toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [caseSearch, casesOptions, taxType]);

  // const filterLovOptions = (
  //   options: any[],
  //   filters: any,
  //   getID: (val: any) => string | null,
  //   lovOptions: Record<string, any[]>
  // ) => {
  //   // if no parentId on any option → just return as-is
  //   if (!options.some((opt) => opt.parentId)) return options;

  //   // collect all selected keys across filters
  //   const selectedParentIds = Object.keys(filters)
  //     .map((key) => getID(filters[key]))
  //     .filter(Boolean);

  //   console.log(
  //     "Selected Parent IDs:",
  //     selectedParentIds,
  //     "Options:",
  //     options
  //   );

  //   // filter by matching parentId
  //   const filtered = options.filter((opt) =>
  //     selectedParentIds.includes(String(opt.parentId))
  //   );

  //   console.log("Filtered Options:", filtered);

  //   // if no match → fallback to all
  //   return filtered.length > 0 ? filtered : options;
  // };

  // 🔸 Apply dynamic prefix to dropdown texts

  const caseNumberOptions = React.useMemo(() => {
    return filteredCaseOptions.map((opt) => {
      const authority = opt.data?.taxAuthority || "Unknown";
      const taxType = opt.data?.taxType;
      let prefix = "CN";
      if (taxType === "Income Tax") prefix = "IT";
      else if (taxType === "Sales Tax") prefix = "ST";

      return {
        key: opt.key, // use the original case ID
        text: `${prefix}-${authority}-${opt.key}`,
      };
    });
  }, [filteredCaseOptions]);

  const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : "";
  };

  // Helper function to get filename without extension
  const getFileNameWithoutExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
  };

  const startEditingAttachment = (id: string, currentName: string) => {
    setEditingAttachment(id);
    setTempName(getFileNameWithoutExtension(currentName));
  };
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

  const cancelEditing = () => {
    setEditingAttachment(null);
    setTempName("");
  };

  useEffect(() => {
    const loadExistingAttachments = async () => {
      if (selectedCase?.ID) {
        const files = await sp.web.lists
          .getByTitle("Core Data Repositories")
          .items.filter(`CaseId eq ${selectedCase?.ID}`)
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

      if (selectedCase?.ID) {
        const taxItems = await sp.web.lists
          .getByTitle("Tax Issues")
          .items.filter(`CaseId eq ${selectedCase.ID}`)();

        const entries = taxItems.map((item: any) => ({
          id: item.Id,
          taxIssue: item.Title,
          amountContested: item.AmountContested,
          rate: item.Rate,
          grossTaxExposure: item.GrossTaxExposure,
        }));

        setTaxIssueEntries(entries);

        // 👇 Initialize rateInputs for display with 2 decimals
        const initialRates: { [key: number]: string } = {};
        entries.forEach((entry, i) => {
          if (entry.rate !== undefined && entry.rate !== null) {
            initialRates[i] = Number(entry.rate).toFixed(2);
          }
        });
        setRateInputs(initialRates);
      }
    };

    if (selectedCase) {
      const prefilledValues: any = {};
      if (selectedCase.Email && !selectedCase.ID) {
        prefilledValues["Email"] = selectedCase.Email;
        reset(prefilledValues);
        return;
      }

      // map dropdowns
      Object.keys(fieldMapping).forEach((label) => {
        const spField = fieldMapping[label];
        const value = selectedCase[spField];
        prefilledValues[spField] =
          typeof value === "string" ? value : value?.toString() || "";
      });

      // inputs
      inputFields.forEach(({ name }) => {
        prefilledValues[name] = selectedCase[name] || "";
      });

      // dates
      dateFields.forEach(({ name }) => {
        prefilledValues[name] = selectedCase[name]
          ? new Date(selectedCase[name])
          : null;
      });

      // multiline
      multilineFields.forEach(({ name }) => {
        prefilledValues[name] = selectedCase[name] || "";
      });
      if (selectedCase.LawyerAssigned0) {
        prefilledValues["LawyerAssigned0"] = selectedCase.LawyerAssigned0;
      }
      if (selectedCase.TaxConsultantAssigned) {
        prefilledValues["TaxConsultantAssigned"] =
          selectedCase.TaxConsultantAssigned;

        // Also set ConsultantEmail automatically
        if (selectedCase.ConsultantEmail) {
          prefilledValues["ConsultantEmail"] = selectedCase.ConsultantEmail;
        }
      }

      prefilledValues["CaseNumber"] = selectedCase["Id"] || "";
      prefilledValues["ParentCaseId"] =
        (
          selectedCase.ParentCaseId || selectedCase.ParentCase?.Id
        )?.toString() || "";

      reset(prefilledValues);
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

  // 🔸 Compute next Case ID for new item
  useEffect(() => {
    if (!selectedCase || (selectedCase.Email && !selectedCase.ID)) {
      (async () => {
        try {
          const items = await sp.web.lists
            .getByTitle("Cases")
            .items.top(1)
            .orderBy("ID", false)(); // descending

          const lastId = items.length > 0 ? items[0].ID : 0;
          setNextCaseNumber(lastId + 1);
        } catch (err) {
          console.error("Failed to fetch next case number:", err);
        }
      })();
    }
  }, [selectedCase, notiID]);

  // 🔸 Submit
  // 1. First, add debugging to see what's happening with LawyerAssigned:
  const submitForm = async (isDraft: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const data = getValues();

    // Clean data object to remove any ID fields
    const cleanData = { ...data };
    delete cleanData.ID;
    delete cleanData.Id;
    delete cleanData.id;

    const prefix = getCaseNumberPrefix();

    // Pre-calculate gross exposure before creating case
    const grossExposures = taxIssueEntries.map(
      (entry) => entry.grossTaxExposure || 0
    );
    const totalGrossExposure =
      grossExposures.length === 1
        ? grossExposures[0]
        : grossExposures.reduce((sum, val) => sum + val, 0);

    // 🔹 Title logic
    let finalTitle: string;

    if (existing) {
      // Editing mode
      if (cleanData.ParentCaseId) {
        // Use Parent Case formatted title (linked case)
        const parentCase = casesOptions.find(
          (opt) => opt.key.toString() === cleanData.ParentCaseId.toString()
        );
        finalTitle = parentCase
          ? parentCase.text
          : `${prefix}${nextCaseNumber}`;
      } else {
        // No parent selected → use the current (selected) case ID
        // If selectedCase.ID exists use it; otherwise fall back to nextCaseNumber
        const currentId =
          selectedCase &&
          (selectedCase.ID || selectedCase.Id || selectedCase.id)
            ? (selectedCase.ID || selectedCase.Id || selectedCase.id).toString()
            : nextCaseNumber?.toString() || "0";
        finalTitle = `${prefix}${currentId}`;
      }
    } else {
      // New case
      finalTitle = `${prefix}${nextCaseNumber}`;
    }

    const itemData: any = {
      Title: finalTitle,
      IsDraft: isDraft,
      CaseStatus: isDraft ? "Draft" : "Pending",
      ApprovalStatus: isDraft ? "" : "Pending",
      GrossExposure: totalGrossExposure,
      ParentCaseId: existing
        ? cleanData.ParentCaseId
          ? Number(cleanData.ParentCaseId)
          : null
        : selectedCase && selectedCase.ID
        ? Number(selectedCase.ID)
        : null,
    };

    // dropdowns - ensure string values
    dropdownFields.forEach((field) => {
      const key = fieldMapping[field];
      const value = cleanData[key];
      itemData[key] =
        typeof value === "string"
          ? value
          : value?.text || value?.Value || value?.toString?.() || "";
    });

    // inputs
    inputFields.forEach(({ name }) => {
      itemData[name] = cleanData[name]?.toString() || "";
    });

    // dates
    dateFields.forEach(({ name }) => {
      const val = cleanData[name as keyof typeof cleanData];
      if (val instanceof Date && !isNaN(val.getTime())) {
        itemData[name] = val.toISOString();
      } else if (typeof val === "string" && val.trim() !== "") {
        const parsed = new Date(val);
        itemData[name] = isNaN(parsed.getTime()) ? null : parsed.toISOString();
      } else {
        itemData[name] = null;
      }
    });

    // multiline
    multilineFields.forEach(({ name }) => {
      itemData[name] = cleanData[name]?.toString() || "";
    });

    itemData["ConsultantEmail"] = cleanData["ConsultantEmail"] || "";
    itemData["LawyerEmail"] = cleanData["LawyerEmail"] || "";
    delete itemData.ID;
    delete itemData.Id;
    delete itemData.id;

    try {
      const finalPayload = {
        ...itemData,
        LinkedNotificationIDId: notiID ? Number(notiID) : null,
      };

      // Create
      const addResult = await sp.web.lists
        .getByTitle("Cases")
        .items.add(finalPayload);

      const itemId = addResult.ID;

      // Run markAsRead in background (non-blocking)
      if (notiID) markAsRead(notiID).catch(console.error);

      // 🔹 Batch add Tax Issues
      if (taxIssueEntries.length > 0) {
        const [batchedSP, execute] = sp.batched();
        taxIssueEntries.forEach((entry) => {
          batchedSP.web.lists.getByTitle("Tax Issues").items.add({
            Title: entry.taxIssue,
            AmountContested: entry.amountContested,
            Rate: entry.rate,
            GrossTaxExposure: entry.grossTaxExposure,
            CaseId: itemId,
          });
        });
        await execute();
      }

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

        return fileItem.update({ CaseId: itemId });
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

            return uploadedItem.update({ CaseId: itemId });
          } catch (err) {
            console.error("Failed to copy attachment:", err);
          }
        }
      );

      // Wait for all attachments together
      await Promise.all([...attachmentPromises, ...existingAttachmentPromises]);

      // Success
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

      loadCasesData;
      setExisting(false);
      onSave(cleanData);
      reset();
      setAttachments([]);
      setExistingAttachments([]);
      setTaxIssueEntries([]);
      setNextCaseNumber(null);
    } catch (error) {
      console.error("Submission failed", error);
      toast.error("Error submitting form", { icon: "⚠️" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
  };

  const datePickerRef = React.useRef<IDatePicker>(null);
  const financialYear = useWatch({ control, name: "FinancialYear" });

  useEffect(() => {
    if (financialYear && taxType === "Income Tax") {
      const yearString = financialYear.toString().replace("FY", "");
      const yearNum = parseInt(yearString, 10);
      if (!isNaN(yearNum)) {
        const nextYear = (yearNum + 1).toString();
        setValue("TaxYear", nextYear, { shouldValidate: true });
      }
    }
  }, [financialYear, taxType, setValue]);

  const financialComboRef = React.useRef<IComboBox>(null);
  const taxComboRef = React.useRef<IComboBox>(null);
  const requiredFields = ["Tax Type", "Tax Authority", "Entity"];
  const handleParentCaseSelect = async (
    parentKey: string | number | undefined
  ) => {
    // if cleared - reset only the ParentCaseId
    if (!parentKey) {
      setValue("ParentCaseId", "");
      return;
    }

    const parentId = Number(parentKey);
    if (isNaN(parentId)) return;

    try {
      // fetch the parent case item
      const parentCase: any = await sp.web.lists
        .getByTitle("Cases")
        .items.getById(parentId)
        .select(
          "ID",
          "Title",
          "TaxType",
          "TaxAuthority",
          "Entity",
          "TaxConsultantAssigned",
          "LawyerAssigned0",
          "Exposure_x0020_Issues",
          "FinancialYear",
          "TaxYear",
          "StayExpiringOn",
          "Dateofdocument",
          "DateReceived",
          "OrderSummary",
          "BriefDescription",
          "Email",
          "ConsultantEmail",
          "LawyerEmail"
        )();

      if (!parentCase) return;

      // Build prefilled object following the same mapping you use for selectedCase
      const prefilled: any = {};

      // Map dropdowns using your fieldMapping
      Object.keys(fieldMapping).forEach((label) => {
        const spField = fieldMapping[label];
        const value = parentCase[spField];
        prefilled[spField] =
          typeof value === "string" ? value : value?.toString() || "";
      });

      // inputs
      inputFields.forEach(({ name }) => {
        prefilled[name] = parentCase[name] || "";
      });

      // dates -> convert to Date instances if present
      dateFields.forEach(({ name }) => {
        prefilled[name] = parentCase[name] ? new Date(parentCase[name]) : null;
      });

      // multiline
      multilineFields.forEach(({ name }) => {
        prefilled[name] = parentCase[name] || "";
      });

      // explicit fields
      if (parentCase.LawyerAssigned0)
        prefilled["LawyerAssigned0"] = parentCase.LawyerAssigned0;
      if (parentCase.TaxConsultantAssigned) {
        prefilled["TaxConsultantAssigned"] = parentCase.TaxConsultantAssigned;
      }
      if (parentCase.ConsultantEmail)
        prefilled["ConsultantEmail"] = parentCase.ConsultantEmail;
      if (parentCase.LawyerEmail)
        prefilled["LawyerEmail"] = parentCase.LawyerEmail;

      // Case number / ParentCaseId
      prefilled["CaseNumber"] = parentCase.ID?.toString() || "";
      prefilled["ParentCaseId"] = parentId.toString();

      // apply to form
      reset(prefilled);

      // load attachments for the selected parent case (Core Data Repositories)
      // const files = await sp.web.lists
      //   .getByTitle("Core Data Repositories")
      //   .items.filter(`CaseId eq ${parentId}`)
      //   .select("FileLeafRef", "FileRef", "ID")();

      // setExistingAttachments(
      //   files.map((file: any) => ({
      //     ID: file.ID,
      //     FileLeafRef: file.FileLeafRef,
      //     FileRef: file.FileRef,
      //     originalName: file.FileLeafRef,
      //     newName: file.FileLeafRef,
      //     isRenamed: false,
      //   }))
      // );

      // load Tax Issues for this parent case
      // const taxItems = await sp.web.lists
      //   .getByTitle("Tax Issues")
      //   .items.filter(`CaseId eq ${parentId}`)();

      // const entries = taxItems.map((item: any) => ({
      //   id: item.Id,
      //   taxIssue: item.Title,
      //   amountContested: item.AmountContested,
      //   rate: item.Rate,
      //   grossTaxExposure: item.GrossTaxExposure,
      // }));

      // setTaxIssueEntries(entries);

      // // prepare rateInputs (2 decimals) to match display logic
      // const initialRates: { [key: number]: string } = {};
      // entries.forEach((entry, i) => {
      //   if (entry.rate !== undefined && entry.rate !== null) {
      //     initialRates[i] = Number(entry.rate).toFixed(2);
      //   }
      // });
      // setRateInputs(initialRates);
    } catch (err) {
      console.error("Failed to load parent case data", err);
      toast.error("Unable to load linked case data");
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(() => submitForm(false))}
        style={{ marginTop: 0 }}
      >
        <div className={styles.topbuttongroup}>
          <div className={styles.selectedCaseTitle}>
            {selectedCase?.Title || ""}
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={styles.cancelbtn}
              type="button"
              onClick={() => {
                setNextCaseNumber(null);
                onCancel();
              }}
            >
              Cancel
            </button>
            <button
              className={styles.draftbtn}
              type="button"
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
        </div>

        <div style={formStyle}>
          {fieldOrder.map((field) => {
            if (field.type === "caseNumber") {
              return !existing ? (
                <TextField
                  key="CaseNumber"
                  label="Case Number"
                  value={
                    nextCaseNumber !== null
                      ? `${getCaseNumberPrefix()}${nextCaseNumber}`
                      : "Generating case number..."
                  }
                  readOnly
                />
              ) : (
                <Controller
                  name="ParentCaseId"
                  control={control}
                  render={({ field: f, fieldState }) => (
                    <ComboBox
                      label="Link Case (If any)"
                      options={caseNumberOptions}
                      selectedKey={f.value ?? ""}
                      onChange={(_, option) => {
                        const key = option?.key ?? "";
                        // update the form field
                        f.onChange(key?.toString?.() ?? "");
                        // load and populate linked case data
                        handleParentCaseSelect(key);
                      }}
                      placeholder={`Type to search case number (e.g. ${getCaseNumberPrefix()}1234)`}
                      allowFreeform
                      onInputValueChange={(text) => setCaseSearch(text || "")}
                      openOnKeyboardFocus
                      useComboBoxAsMenuWidth
                      autoComplete="on"
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
                      errorMessage={fieldState?.error?.message}
                    />
                  )}
                />
              );
            }

            if (field.type === "input")
              return (
                <Controller
                  key={field.name}
                  name={field.name as string}
                  control={control}
                  render={({ field: f }) => (
                    <TextField
                      label={field.label}
                      {...f}
                      placeholder={field.label}
                    />
                  )}
                />
              );

            if (field.type === "dropdown") {
              const internalName = fieldMapping[field.label];
              if (field.label === "Financial Year") {
                return (
                  <Controller
                    key={field.label}
                    name={internalName}
                    control={control}
                    render={({ field: f }) => (
                      <ComboBox
                        key={f.value ?? "empty"}
                        label={field.label}
                        options={financialYearOptions}
                        selectedKey={f.value ?? undefined}
                        componentRef={financialComboRef}
                        onClick={() => financialComboRef.current?.focus(true)}
                        onChange={(_, option) => {
                          // if already selected and user clicks same option again → clear
                          if (f.value === option?.key) {
                            f.onChange(undefined);
                          } else {
                            f.onChange(option?.key as string);
                          }
                        }}
                        // onChange={(_, o) => f.onChange(o?.text)}
                        placeholder="Select Year"
                        allowFreeform={true}
                        autoComplete="on"
                        useComboBoxAsMenuWidth
                        onInputValueChange={handleFinancialYearInputChange}
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
                );
              }
              if (field.label === "Tax Year") {
                return (
                  <Controller
                    key={field.label}
                    name={internalName}
                    control={control}
                    render={({ field: f }) => (
                      <ComboBox
                        key={f.value ?? "empty"}
                        label={field.label}
                        options={taxYearOptions}
                        selectedKey={f.value ?? undefined}
                        componentRef={taxComboRef}
                        onClick={() => taxComboRef.current?.focus(true)}
                        allowFreeform={true}
                        onInputValueChange={handleTaxYearInputChange}
                        useComboBoxAsMenuWidth
                        onChange={(_, option) => {
                          if (f.value === option?.key) {
                            f.onChange(undefined);
                          } else {
                            f.onChange(option?.key as string);
                          }
                        }}
                        placeholder="Select Tax Year"
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
                );
              }
              if (field.label === "Tax Consultant Assigned") {
                const internalName = fieldMapping[field.label];
                if (!internalName) return null;

                return (
                  <Controller
                    name={internalName}
                    control={control}
                    render={({ field: f }) => (
                      <Dropdown
                        label={field.label}
                        options={taxConsultantOptions}
                        selectedKey={f.value ?? undefined}
                        onChange={(_, option) => {
                          f.onChange(option?.key as string);
                          setValue(
                            "ConsultantEmail",
                            option?.data?.email || ""
                          );
                        }}
                        placeholder="Select Tax Consultant"
                      />
                    )}
                  />
                );
              }

              if (field.label === "Lawyer Assigned") {
                const internalName = fieldMapping[field.label];
                if (!internalName) return null;

                return (
                  <Controller
                    name={internalName}
                    control={control}
                    render={({ field: f }) => (
                      <Dropdown
                        label={field.label}
                        options={lawyerOptions}
                        selectedKey={f.value ?? undefined}
                        onChange={(_, option) => {
                          f.onChange(option?.key as string);
                          setValue("LawyerEmail", option?.data?.email || "");
                        }}
                        placeholder="Select Lawyer Assigned"
                      />
                    )}
                  />
                );
              }

              return (
                <Controller
                  name={internalName}
                  control={control}
                  rules={
                    requiredFields.includes(field.label)
                      ? { required: `${field.label} is required` }
                      : {}
                  }
                  render={({ field: f, fieldState: { error } }) => {
                    const isRequired = requiredFields.includes(field.label);
                    const labelWithStar = isRequired
                      ? `${field.label} *`
                      : field.label;

                    return (
                      <div
                        style={{
                          position: "relative",
                          display: "inline-block",
                          width: "100%",
                        }}
                      >
                        <Dropdown
                          key={f.value ?? "empty"}
                          label={labelWithStar}
                          options={lovOptions[field.label] || []}
                          selectedKey={f.value ?? undefined}
                          onChange={(_, option) => {
                            if (f.value === option?.key) {
                              f.onChange(undefined);
                            } else {
                              f.onChange(option?.key as string);
                            }
                          }}
                          placeholder={`Select ${field.label}`}
                          errorMessage={error?.message}
                        />

                        {f.value && (
                          <button
                            type="button"
                            onClick={() => f.onChange(undefined)}
                            style={{
                              position: "absolute",
                              right: 30,
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
                    );
                  }}
                />
              );
            }

            if (field.type === "date")
              return (
                <Controller
                  key={field.name}
                  name={field.name as string}
                  control={control}
                  render={({ field: f }) => {
                    return (
                      <div
                        className="date-picker-wrapper"
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <DatePicker
                          label={field.label}
                          value={f.value}
                          placeholder="Select a date"
                          componentRef={datePickerRef}
                          onSelectDate={(date) => f.onChange(date)}
                          allowTextInput
                          calloutProps={{
                            preventDismissOnScroll: true,
                          }}
                          styles={{
                            root: { width: "100%" },
                            textField: { width: "100%" },
                          }}
                        />

                        {f.value && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => f.onChange(undefined)}
                            style={{
                              position: "absolute",
                              right: 22, // snug inside input
                              top: "69%", // vertically centered
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
                    );
                  }}
                />
              );

            return null;
          })}

          {/* Multiline fields */}
          {multilineFields.map(({ label, name }) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => (
                <TextField
                  label={label}
                  {...field}
                  multiline
                  placeholder={label}
                  rows={4}
                  styles={{ root: { gridColumn: "span 3" } }}
                />
              )}
            />
          ))}
          {/* Attachments */}
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
                        width: "fix-",
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
        </div>

        {/* Tax Issues */}
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
              <TextField
                label="Amount Contested"
                placeholder="Amount Contested"
                type="text"
                value={
                  entry.amountContested !== undefined &&
                  entry.amountContested !== null
                    ? new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      }).format(entry.amountContested)
                    : ""
                }
                styles={{ root: { flex: 1 } }}
                onChange={(_, v) => {
                  const numericValue =
                    v?.replace(/,/g, "").replace(/[^0-9.]/g, "") || "";
                  const updated = [...taxIssueEntries];
                  updated[idx].amountContested = numericValue
                    ? parseFloat(numericValue)
                    : 0;

                  // Convert rate to decimal before multiplying
                  const rateAsDecimal = (updated[idx].rate || 0) / 100;

                  // Calculate Gross Exposure automatically
                  updated[idx].grossTaxExposure =
                    updated[idx].amountContested * rateAsDecimal;

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
                  rateInputs[idx] !== undefined
                    ? rateInputs[idx]
                    : entry.rate !== undefined && entry.rate !== null
                    ? entry.rate.toString()
                    : ""
                }
                onChange={(_, v) => {
                  // Allow only numbers and a single decimal
                  const cleaned = v?.replace(/[^0-9.]/g, "") || "";
                  const singleDot = cleaned.replace(/(\..*)\./g, "$1");

                  // Update temporary input state
                  setRateInputs((prev) => ({ ...prev, [idx]: singleDot }));

                  const parsed = parseFloat(singleDot);
                  if (!isNaN(parsed)) {
                    const updated = [...taxIssueEntries];
                    updated[idx].rate = parsed; // stays a number ✅
                    updated[idx].grossTaxExposure =
                      (updated[idx].amountContested || 0) * (parsed / 100);
                    setTaxIssueEntries(updated);
                  }
                }}
                onBlur={() => {
                  const parsed = parseFloat(rateInputs[idx]);
                  if (!isNaN(parsed)) {
                    const rounded = parsed.toFixed(2);
                    setRateInputs((prev) => ({ ...prev, [idx]: rounded }));

                    const updated = [...taxIssueEntries];
                    updated[idx].rate = parseFloat(rounded); // stored as number ✅
                    setTaxIssueEntries(updated);
                  }
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
                readOnly
              />

              {/* Remove Button */}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  marginTop: "20px",
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

export default CaseForm;
