/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
import "react-datepicker/dist/react-datepicker.css";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { TextField } from "@fluentui/react/lib/TextField";
import { DatePicker, IDatePicker } from "@fluentui/react/lib/DatePicker";
import styles from "./CaseForm.module.scss";
import "react-toastify/dist/ReactToastify.css";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { ComboBox, IComboBoxOption } from "@fluentui/react";

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
  const { control, handleSubmit, reset, getValues } = useForm();
  const taxType = useWatch({ control, name: "TaxType" });

  const [lovOptions, setLovOptions] = useState<{
    [key: string]: IDropdownOption[];
  }>({});
  const [casesOptions, setCasesOptions] = React.useState<IComboBoxOption[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [caseSearch, setCaseSearch] = useState("");
  const [removedAttachments, setRemovedAttachments] = useState<string[]>([]);
  const [taxIssueEntries, setTaxIssueEntries] = useState<
    {
      id: any;
      taxIssue: string;
      amountContested: number;
      grossTaxExposure: number;
    }[]
  >([]);
  const [nextCaseNumber, setNextCaseNumber] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // 🔹 helper: prefix from Tax Type
  const getCaseNumberPrefix = () => {
    if (taxType === "Income Tax") return "IT-0";
    if (taxType === "Sales Tax") return "ST-0";
    return "CN-0";
  };

  const fieldMapping: { [key: string]: string } = {
    "Tax Type": "TaxType",
    Entity: "Entity",
    "Tax Authority": "TaxAuthority",
    "Concerning Law": "ConcerningLaw",
    "Correspondence Type": "CorrespondenceType",
    "Issued By": "IssuedBy",
    "Pending Authority": "PendingAuthority",
    "Tax exposure Stage": "TaxexposureStage",
    "Tax Consultant Assigned": "TaxConsultantAssigned",
    "Exposure Issues": "Exposure_x0020_Issues",
    "Financial Year": "FinancialYear",
    "Tax Year": "TaxYear",
    "Stay Expiring On": "StayExpiringOn",
    "Tax Exposure": "TaxExposure",
  };

  const dropdownFields = Object.keys(fieldMapping);
  const inputFields = [
    { label: "Document Reference Number", name: "DocumentReferenceNumber" },
    { label: "Email – Title", name: "Email" },
    // { label: "Brief Description", name: "BriefDescription" },
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
    { type: "dropdown", label: "Concerning Law" },
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
    { type: "dropdown", label: "Tax exposure Stage" },
    { type: "input", label: "Tax Exposure", name: "TaxExposure" },
    { type: "dropdown", label: "Tax Consultant Assigned" },
    { type: "dropdown", label: "Exposure Issues" },
    { type: "input", label: "Email – Title", name: "Email" },
  ];

  const getYearOptions = (): IDropdownOption[] => {
    const currentYear = new Date().getFullYear();
    const years: IDropdownOption[] = [];
    for (let y = currentYear; y >= 1980; y--) {
      years.push({ key: "FY" + y.toString(), text: "FY" + y.toString() });
    }
    return years;
  };

  const getTaxYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years: IDropdownOption[] = [];
    for (let i = currentYear; i >= 1980; i--) {
      years.push({
        key: i.toString(),
        text: i.toString(),
      });
    }
    return years;
  };

  // Check if we're creating a new case from a notification
  // useEffect(() => {
  //   if (selectedCase && selectedCase.Email && !selectedCase.ID) {
  //     setIsNewCaseFromNotification(true);
  //   } else {
  //     setIsNewCaseFromNotification(false);
  //   }
  // }, [selectedCase]);

  // 🔸 Load LOVs & base cases list
  useEffect(() => {
    const fetchLOVsAndCases = async () => {
      // 🔹 Fetch LOVs and filter Active
      const lovItems = await sp.web.lists
        .getByTitle("LOVData1")
        .items.select(
          "Id",
          "Title",
          "Value",
          "Status",
          "Parent/Id",
          "Parent/Title",
          "Parent/Value"
        )
        .expand("Parent")();

      const activeLOVs = lovItems.filter((item) => item.Status === "Active");
      const grouped: {
        [key: string]: {
          key: number;
          text: string;
          parentId?: number;
          parentValue?: string;
        }[];
      } = {};

      activeLOVs.forEach((item) => {
        if (!grouped[item.Title]) grouped[item.Title] = [];
        grouped[item.Title].push({
          key: item.Id,
          text: item.Value,
          parentId: item.Parent?.Id || null,
          parentValue: item.Parent?.Value || null,
        });
      });
      console.log("Grouped LOV Options:", grouped);
      setLovOptions(grouped);

      // 🔹 Fetch only Active Cases
      const caseItems = await sp.web.lists
        .getByTitle("Cases")
        .items.select("ID", "Title", "TaxType", "CaseStatus")(); // 👈 include Status

      const activeCases = caseItems.filter(
        (item) => item.CaseStatus === "Active"
      ); // 👈 filter

      const options: IComboBoxOption[] = activeCases.map((item) => ({
        key: item.ID.toString(),
        text:
          item.TaxType === "Income Tax"
            ? `IT-${item.ID.toString().padStart(4, "0")}`
            : item.TaxType === "Sales Tax"
            ? `ST-${item.ID.toString().padStart(4, "0")}`
            : `CN-${item.ID.toString().padStart(4, "0")}`,
        data: { taxType: item.TaxType },
      }));

      setCasesOptions(options);
    };

    fetchLOVsAndCases();
  }, []);

  // filter by Tax Type
  const filteredCaseOptions = React.useMemo(() => {
    let filtered = casesOptions;

    // Filter by Tax Type first
    if (taxType) {
      filtered = filtered.filter((opt) => opt.data?.taxType === taxType);
    }

    // Then apply search filter if there's search text
    if (caseSearch) {
      const searchLower = caseSearch.toLowerCase();
      filtered = filtered.filter((opt) =>
        opt.text?.toString().toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [caseSearch, casesOptions, taxType]);
  // Recursively check if option’s parent is satisfied
  // ✅ Parent-child dependency check
//  const isOptionAllowed = (
//   opt: { key: string | number; text: string; parentId?: number },
//   fieldLabel: string,
//   watchedValues: any
// ): boolean => {
//   // agar option ka parent hi nai hai → sab allowed
//   if (!opt.parentId) return true;

//   // parent field find karo (jahan parentId ka match mile)
//   const parentField = Object.keys(lovOptions).find((fld) =>
//     lovOptions[fld]?.some((p: any) => String(p.key) === String(opt.parentId))
//   );

//   if (!parentField) return true;

//   // parent ki current selected value
//   const selectedParentKey = watchedValues[parentField];

//   // agar koi parent select hi nai hai → sab allow
//   if (!selectedParentKey) return true;

//   // filter karo: sirf tab show karo jab option ka parentId == selected parent
//   const isAllowed = String(selectedParentKey) === String(opt.parentId);

//   // check karo kya is parent ke liye koi child exist karta hai
//   const anyAllowed = lovOptions[fieldLabel]?.some(
//     (o: any) => String(o.parentId) === String(selectedParentKey)
//   );

//   // agar is parent ke liye koi child hi nai hai → sab allow (fallback)
//   if (!anyAllowed) return true;

//   return isAllowed;
// };
const filterLovOptions = (
  options: any[],
  filters: any,
  getID: (val: any) => string | null,
  lovOptions: Record<string, any[]>
) => {
  // if no parentId on any option → just return as-is
  if (!options.some(opt => opt.parentId)) return options;

  // collect all selected keys across filters
  const selectedParentIds = Object.keys(filters)
    .map(key => getID(filters[key]))
    .filter(Boolean);

  console.log("Selected Parent IDs:", selectedParentIds, "Options:", options);

  // filter by matching parentId
  const filtered = options.filter(opt =>
    selectedParentIds.includes(String(opt.parentId))
  );

  console.log("Filtered Options:", filtered);

  // if no match → fallback to all
  return filtered.length > 0 ? filtered : options;
};



  // 🔸 Apply dynamic prefix to dropdown texts
  const caseNumberOptions = React.useMemo(() => {
    return filteredCaseOptions.map((opt) => ({
      ...opt,
      text: opt.text.replace(/^CN-0/, getCaseNumberPrefix()),
    }));
  }, [filteredCaseOptions, taxType]);

  // 🔸 Prefill when editing + load attachments & tax issues for selected case

  useEffect(() => {
    const loadExistingAttachments = async () => {
      if (selectedCase?.ID) {
        const files = await sp.web.lists
          .getByTitle("Core Data Repositories")
          .items.filter(`CaseId eq ${selectedCase.ID}`)
          .select("FileLeafRef", "FileRef", "ID")();
        setExistingAttachments(files);
      }

      if (selectedCase?.ID) {
        const taxItems = await sp.web.lists
          .getByTitle("Tax Issues")
          .items.filter(`CaseId eq ${selectedCase.ID}`)();
        setTaxIssueEntries(
          taxItems.map((item: any) => ({
            id: item.Id,
            taxIssue: item.Title,
            amountContested: item.AmountContested,
            grossTaxExposure: item.GrossTaxExposure,
          }))
        );
      }
    };

    if (selectedCase) {
      const prefilledValues: any = {};

      // If it's a new case from notification, only set the email
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

      prefilledValues["CaseNumber"] = selectedCase["ID"] || "";
      prefilledValues["ParentCaseId"] = selectedCase["ParentCaseId"] || "";

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
  const submitForm = async (isDraft: boolean) => {
    if (isSubmitting) return; // prevent double clicks
    setIsSubmitting(true);

    const data = getValues();
    const prefix = getCaseNumberPrefix();

    const itemData: any = {
      IsDraft: isDraft,
      CaseStatus: isDraft ? "Draft" : "Active",
      ParentCaseId: existing
        ? data.ParentCaseId
          ? Number(data.ParentCaseId)
          : null
        : selectedCase && selectedCase.ID
        ? Number(selectedCase.ID)
        : null,
    };

    // Only assign new Title if creating a new case (not updating draft)
    if (!(selectedCase?.ID && selectedCase.CaseStatus === "Draft")) {
      itemData.Title = `${prefix}${nextCaseNumber}`;
    }

    // dropdowns
    dropdownFields.forEach((field) => {
      const key = fieldMapping[field];
      const value = data[key];
      itemData[key] =
        typeof value === "string"
          ? value
          : value?.text || value?.Value || value?.toString?.() || "";
    });

    // inputs
    inputFields.forEach(({ name }) => {
      itemData[name] = data[name] || "";
    });

    // dates
    dateFields.forEach(({ name }) => {
      const key = name as keyof typeof data;
      const val = data[key];
      if (val instanceof Date) {
        itemData[key] = val.toISOString();
      } else if (typeof val === "string" && val.trim() !== "") {
        const parsed = new Date(val);
        itemData[key] = isNaN(parsed.getTime()) ? null : parsed.toISOString();
      } else {
        itemData[key] = null;
      }
    });

    // multiline
    multilineFields.forEach(({ name }) => {
      itemData[name] = data[name] || "";
    });

    if (data.LawyerAssigned) {
      itemData["LawyerAssignedId"] =
        data.LawyerAssigned.Id || data.LawyerAssigned.id || null;
    }

    try {
      console.log("Submitting itemData:", itemData);
      let itemId: number;

      // 🔹 Update draft or add new case
      if (isDraft && selectedCase?.ID && selectedCase.CaseStatus === "Draft") {
        await sp.web.lists
          .getByTitle("Cases")
          .items.getById(selectedCase.ID)
          .update({
            ...itemData,
            LinkedNotificationIDId: notiID || null,
          });
        itemId = selectedCase.ID;
        console.log(`Updated draft case ID ${itemId}`);
      } else {
        const addResult = await sp.web.lists.getByTitle("Cases").items.add({
          ...itemData,
          LinkedNotificationIDId: notiID || null,
        });
        itemId = addResult.ID;
        console.log(`Created new case ID ${itemId}`);
      }

      // 🔹 Mark notification as read if linked
      if (notiID) await markAsRead(notiID);

      // 🔹 Save Tax Issues (update if exists, else add)
      for (const entry of taxIssueEntries) {
        if (entry.id) {
          await sp.web.lists
            .getByTitle("Tax Issues")
            .items.getById(entry.id)
            .update({
              Title: entry.taxIssue,
              AmountContested: entry.amountContested,
              GrossTaxExposure: entry.grossTaxExposure,
            });
        } else {
          await sp.web.lists.getByTitle("Tax Issues").items.add({
            Title: entry.taxIssue,
            AmountContested: entry.amountContested,
            GrossTaxExposure: entry.grossTaxExposure,
            CaseId: itemId,
          });
        }
      }

      // 🔹 Upload attachments & link to Case
      for (const file of attachments) {
        const uploadResult: any = await sp.web.lists
          .getByTitle("Core Data Repositories")
          .rootFolder.files.addUsingPath(file.name, file, { Overwrite: true });

        const serverRelativeUrl = uploadResult.ServerRelativeUrl;
        const fileItem = await sp.web
          .getFileByServerRelativePath(serverRelativeUrl)
          .getItem();

        await fileItem.update({ CaseId: itemId });
      }

      // 🔹 Copy inbox attachments (if from notification)
      if (notiID) {
        for (const inboxFile of existingAttachments) {
          if (removedAttachments.includes(inboxFile.FileLeafRef)) {
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

            await uploadedItem.update({ CaseId: itemId });
          } catch (err) {
            console.error("Failed to copy inbox attachment", err);
          }
        }
      }
      loadCasesData();
      setExisting(false);
      alert(isDraft ? "Draft saved" : "Case submitted");
      onSave(data);
      reset();
      setAttachments([]);
      setExistingAttachments([]);
      setTaxIssueEntries([]);
      setNextCaseNumber(null);
    } catch (error) {
      console.error("Submission failed", error);
      alert("Error submitting form.");
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
  const watchedValues = useWatch({ control });

  return (
    <form
      onSubmit={handleSubmit(() => submitForm(false))}
      style={{ marginTop: 0 }}
    >
      <div className={styles.topbuttongroup}>
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

      <div style={formStyle}>
        {fieldOrder.map((field) => {
          if (field.type === "caseNumber") {
            return !existing ? (
              // New Case → readonly Case Number with dynamic prefix
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
              // Editing Case → Dropdown for ParentCaseId (with dynamic prefix in text)
              <Controller
                key="CaseNumber"
                name="ParentCaseId"
                control={control}
                render={({ field: f }) => (
                  <ComboBox
                    label="Case Number"
                    options={[
                      { key: "", text: "-- None --" },
                      ...caseNumberOptions,
                    ]}
                    selectedKey={f.value?.toString() ?? ""}
                    onChange={(_, option) => {
                      f.onChange((option?.key as string) || "");
                      setCaseSearch(""); // Clear search after selection
                    }}
                    placeholder={`Type to search case number (e.g. ${getCaseNumberPrefix()}15)`}
                    allowFreeform
                    onInputValueChange={(text) => {
                      setCaseSearch(text || "");
                    }}
                    openOnKeyboardFocus
                    useComboBoxAsMenuWidth
                    autoComplete="on"
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

            // ✅ If it's the "Financial Year" field → show years dropdown
            if (field.label === "Financial Year") {
              return (
                <Controller
                  key={field.label}
                  name={internalName}
                  control={control}
                  render={({ field: f }) => (
                    <ComboBox
                      label={field.label}
                      options={getYearOptions()}
                      selectedKey={f.value}
                      onChange={(_, o) => f.onChange(o?.key)}
                      placeholder="Select Year"
                      allowFreeform={false}
                      autoComplete="on"
                      styles={{
                        callout: {
                          maxHeight: "30vh",
                          overflowY: "auto",
                          directionalHintFixed: true,
                          directionalHint: 6,
                        },
                        optionsContainerWrapper: {
                          minWidth: 100,
                        },
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
                      label={field.label}
                      options={getTaxYearOptions()}
                      selectedKey={f.value}
                      onChange={(_, o) => f.onChange(o?.key)}
                      placeholder="Select Tax Year"
                      styles={{
                        callout: {
                          maxHeight: "30vh",
                          overflowY: "auto",
                          directionalHintFixed: true,
                          directionalHint: 6,
                        },
                        optionsContainerWrapper: {
                          minWidth: 100,
                        },
                      }}
                    />
                  )}
                />
              );
            }

            // 🔹 Otherwise normal LOV dropdown
            return (
           <Controller
  key={internalName}
  name={internalName}
  control={control}
  render={({ field: f }) => {
    const allOptions = lovOptions[field.label] || [];

    const getID = (val: any): string | null => {
      if (!val) return null;
      return typeof val === "object" ? val.key?.toString() : val.toString();
    };
    

    const filteredOptions = filterLovOptions(
      allOptions,
      watchedValues,
      getID,
      lovOptions
    );

    return (
      <Dropdown
        label={field.label}
        options={filteredOptions}
        selectedKey={f.value}
        onChange={(_, o) => f.onChange(o?.key)}
        placeholder={`Select ${field.label}`}
      />
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
                    <DatePicker
                      label={field.label}
                      value={f.value}
                      placeholder="Select a date"
                      componentRef={datePickerRef}
                      onSelectDate={(date) => f.onChange(date)}
                    />
                  );
                }}
              />
            );

          return null;
        })}

        {/* People Picker */}
        <Controller
          name="LawyerAssigned"
          control={control}
          render={({ field }) => (
            <div style={{ gridColumn: "span 1" }}>
              <PeoplePicker
                context={SpfxContext}
                titleText="Lawyer Assigned"
                personSelectionLimit={1}
                showHiddenInUI={false}
                ensureUser={true}
                principalTypes={[PrincipalType.User]}
                resolveDelay={500}
                defaultSelectedUsers={
                  selectedCase?.LawyerAssigned &&
                  selectedCase.LawyerAssigned.Title
                    ? [selectedCase.LawyerAssigned.Title]
                    : []
                }
                onChange={(items: any[]) => {
                  const selectedUser = items[0];
                  if (selectedUser) {
                    field.onChange({
                      Id: selectedUser.id,
                      Email: selectedUser.secondaryText,
                      Title: selectedUser.text,
                    });
                  } else {
                    field.onChange(null);
                  }
                }}
              />
            </div>
          )}
        />

        {/* Attachments */}
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
                <button
                  onClick={() => {
                    setRemovedAttachments((prev) => [
                      ...prev,
                      file.FileLeafRef,
                    ]);

                    setExistingAttachments((prev) =>
                      prev.filter((f) => f.FileLeafRef !== file.FileLeafRef)
                    );
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

export default CaseForm;
