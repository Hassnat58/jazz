/* eslint-disable prefer-const */
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
import "react-datepicker/dist/react-datepicker.css";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { TextField } from "@fluentui/react/lib/TextField";
import { DatePicker } from "@fluentui/react/lib/DatePicker";
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
  const [lovOptions, setLovOptions] = useState<{
    [key: string]: IDropdownOption[];
  }>({});
  const [casesOptions, setCasesOptions] = React.useState<IComboBoxOption[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [caseSearch, setCaseSearch] = useState("");
  const [taxIssueEntries, setTaxIssueEntries] = useState<
    {
      id: any;
      taxIssue: string;
      amountContested: number;
      grossTaxExposure: number;
    }[]
  >([]);
  const [nextCaseNumber, setNextCaseNumber] = useState<number | null>(null);
  // const [currentTaxIssue, setCurrentTaxIssue] = useState<{
  //   taxIssue: string;
  //   id: any;
  //   amountContested: number;
  //   grossTaxExposure: number;
  // }>({
  //   taxIssue: "",
  //   id: null,
  //   amountContested: 0,
  //   grossTaxExposure: 0,
  // });
  const sp = spfi().using(SPFx(SpfxContext));
  const markAsRead = async (id: number) => {
    try {
      const sp = spfi().using(SPFx(SpfxContext));
      await sp.web.lists.getByTitle("Inbox").items.getById(id).update({
        Status: "Read",
      });

      // Update local state so UI updates immediately
    } catch (err) {
      console.error("Error updating notification status:", err);
    }
  };

  const fieldMapping: { [key: string]: string } = {
    Entity: "Entity",
    TaxAuthority: "TaxAuthority",
    Jurisdiction: "Jurisdiction",
    "Concerning Law": "ConcerningLaw",
    "Correspondence Type": "CorrespondenceType",
    IssuedBy: "IssuedBy",
    "Next Forum/Pending Authority": "NextForum_x002f_PendingAuthority",
    "Tax exposure Stage": "TaxexposureStage",
    "Tax Consultant Assigned": "TaxConsultantAssigned",
    "Exposure Issues": "Exposure_x0020_Issues",
    "Financial Year": "FinancialYear",
  };

  const dropdownFields = Object.keys(fieldMapping);
  const inputFields = [
    { label: "Document Reference Number", name: "DocumentReferenceNumber" },
    { label: "Gross Tax Demanded/Exposure", name: "GrossTaxDemanded" },
    { label: "Email – Title", name: "Email" },
    { label: "Brief Description", name: "BriefDescription" },
    { label: "Case Brief Description", name: "CaseBriefDescription" },
  ];

  const dateFields = [
    { label: "Date of Document", name: "Dateofdocument" },
    { label: "Date Received", name: "DateReceived" },
    { label: "Date of Compliance", name: "DateofCompliance" },
    { label: "Hearing Date", name: "Hearingdate" },
  ];

  const multilineFields = [
    { label: "Brief Description", name: "BriefDescription" },
    { label: "Case Brief Description", name: "CaseBriefDescription" },
  ];

  const fieldOrder = [
    {
      type: "input",
      label: "Document Reference Nummber",
      name: "DocumentReferenceNumber",
    },
    { type: "dropdown", label: "Entity" },
    { type: "dropdown", label: "TaxAuthority" },
    { type: "dropdown", label: "Jurisdiction" },
    { type: "dropdown", label: "Concerning Law" },
    { type: "dropdown", label: "Correspondence Type" },
    { type: "dropdown", label: "IssuedBy" },
    { type: "date", label: "Date of Document", name: "Dateofdocument" },
    { type: "date", label: "Date Received", name: "DateReceived" },
    { type: "dropdown", label: "Financial Year" },
    { type: "dropdown", label: "Next Forum/Pending Authority" },
    { type: "date", label: "Date of Compliance", name: "DateofCompliance" },
    { type: "date", label: "Hearing Date", name: "Hearingdate" },
    { type: "dropdown", label: "Tax exposure Stage" },
    { type: "dropdown", label: "Tax Consultant Assigned" },
    { type: "dropdown", label: "Exposure Issues" },
    {
      type: "input",
      label: "Gross Tax Demanded/Exposure",
      name: "GrossTaxDemanded",
    },
    { type: "input", label: "Email – Title", name: "Email" },
  ];

  useEffect(() => {
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
    fetchLOVs();
    sp.web.lists
      .getByTitle("Cases")
      .items.select("ID", "Title")()
      .then((items) => {
        const options: IComboBoxOption[] = items.map((item) => ({
          key: item.ID.toString(), // ← string key
          text: `CN--00${item.ID}`, // ← text is the Case Number
        }));
        setCasesOptions(options);
      });
  }, []);
  const filteredCaseOptions = React.useMemo(() => {
    if (!caseSearch) return casesOptions;
    const q = caseSearch.toLowerCase();
    return casesOptions.filter((o) =>
      (o.text as string).toLowerCase().includes(q)
    );
  }, [caseSearch, casesOptions]);

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
          taxItems.map((item) => ({
            id: item.Id, // store the SharePoint item ID
            taxIssue: item.Title,
            amountContested: item.AmountContested,
            grossTaxExposure: item.GrossTaxExposure,
          }))
        );
      }
    };

    if (selectedCase) {
      const prefilledValues: any = {};
      dropdownFields.forEach((field) => {
        const fieldName = fieldMapping[field];
        const value = selectedCase[fieldName];

        // Ensure it's a string or null
        prefilledValues[fieldName] =
          typeof value === "string" ? value : value?.toString() || "";
      });
      inputFields.forEach(({ name }) => {
        prefilledValues[name] = selectedCase[name] || "";
      });
      dateFields.forEach(({ name }) => {
        prefilledValues[name] = selectedCase[name]
          ? new Date(selectedCase[name])
          : null;
      });
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
    if (!selectedCase) {
      // Fetch last Case ID
      sp.web.lists
        .getByTitle("Cases")
        .items.top(1)
        .orderBy("ID", false)() // descending
        .then((items) => {
          const lastId = items.length > 0 ? items[0].ID : 0;
          setNextCaseNumber(lastId + 1);
        });
    }
  }, [selectedCase]);

  const submitForm = async (isDraft: boolean) => {
    const data = getValues();

    const itemData: any = {
      Title: `CN--00${nextCaseNumber}`, // always new case number
      IsDraft: isDraft,
      CaseStatus: isDraft ? "Draft" : "Active",
      ParentCaseId: selectedCase ? Number(selectedCase.ID) : null, // link back if cloning
    };

    // dropdowns
    dropdownFields.forEach((field) => {
      const key = fieldMapping[field];
      const value = data[key];
      itemData[key] =
        typeof value === "string"
          ? value
          : value?.text || value?.Description || value?.toString?.() || "";
    });

    // inputs
    inputFields.forEach(({ name }) => {
      itemData[name] =
        name === "GrossTaxDemanded"
          ? parseFloat(data[name]) || 0
          : data[name] || "";
    });

    // dates
    dateFields.forEach(({ name }) => {
      itemData[name] = data[name] || null;
    });

    // multi-line text
    multilineFields.forEach(({ name }) => {
      itemData[name] = data[name] || "";
    });

    if (data.LawyerAssigned) {
      itemData["LawyerAssignedId"] =
        data.LawyerAssigned.Id || data.LawyerAssigned.id || null;
    }

    console.log("Final itemData before submit:", itemData);

    try {
      const addResult = await sp.web.lists.getByTitle("Cases").items.add({
        ...itemData,
        LinkedNotificationIDId: notiID || null,
      });
      markAsRead(notiID);
      const itemId = addResult.ID;

      // add tax issues
      for (const entry of taxIssueEntries) {
        await sp.web.lists.getByTitle("Tax Issues").items.add({
          Title: entry.taxIssue,
          AmountContested: entry.amountContested,
          GrossTaxExposure: entry.grossTaxExposure,
          CaseId: itemId,
        });
      }

      // upload attachments
      for (const file of attachments) {
        const uploadResult = await sp.web.lists
          .getByTitle("Core Data Repositories")
          .rootFolder.files.addUsingPath(file.name, file, { Overwrite: true });

        const serverRelativeUrl = uploadResult.ServerRelativeUrl;

        const fileItem = await sp.web
          .getFileByServerRelativePath(serverRelativeUrl)
          .getItem();

        await fileItem.update({ CaseId: itemId });
      }
      loadCasesData();
      setExisting(false);
      alert(isDraft ? "Draft saved" : "Case submitted");
      onSave(data);
      reset();
      setAttachments([]);
    } catch (error) {
      console.error("Submission failed", error);
      alert("Error submitting form.");
    }
  };

  const formStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
  };
  console.log(selectedCase, "caseeee");

  return (
    <form
      onSubmit={handleSubmit(() => submitForm(false))}
      style={{ marginTop: "0px" }}
    >
      <div className={styles.topbuttongroup}>
        <button className={styles.cancelbtn} type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={styles.draftbtn}
          type="button"
          onClick={() => submitForm(true)}
        >
          Save as Draft
        </button>
        <button className={styles.savebtn} type="submit">
          Submit
        </button>
      </div>
      <div style={formStyle}>
        {!existing ? (
          // New Case → readonly Case Number
          <TextField
            label="Case Number"
            value={nextCaseNumber ? `CN--00${nextCaseNumber}` : "Loading..."}
            readOnly
          />
        ) : (
          // Editing Case → Dropdown for ParentCaseId

          <Controller
            name="ParentCaseId"
            control={control}
            render={({ field: f }) => (
              <ComboBox
                label="Case Number"
                options={[
                  { key: "", text: "-- None --" },
                  ...filteredCaseOptions,
                ]}
                // store as string in the form; convert later when you need a number
                selectedKey={f.value?.toString() ?? ""}
                onChange={(_, option) =>
                  f.onChange((option?.key as string) || "")
                }
                placeholder="Type to search case number (e.g. CN--0015)"
                // lets the user type freely; value is committed only when an option is picked
                allowFreeform
                // track the typed text and filter options
                onInputValueChange={(text) => setCaseSearch(text || "")}
                // optional: clear the search when menu closes so full list shows next time
                onMenuDismissed={() => setCaseSearch("")}
                // optional niceties
                openOnKeyboardFocus
                useComboBoxAsMenuWidth
              />
            )}
          />
        )}

        {fieldOrder.map((field) => {
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
                    type={field.name === "GrossTaxDemanded" ? "number" : "text"}
                  />
                )}
              />
            );
          if (field.type === "dropdown") {
            const internalName = fieldMapping[field.label];
            return (
              <Controller
                key={field.label}
                name={internalName}
                control={control}
                render={({ field: f }) => (
                  <Dropdown
                    label={field.label}
                    options={lovOptions[field.label] || []}
                    selectedKey={f.value}
                    onChange={(_, o) => f.onChange(o?.key)}
                  />
                )}
              />
            );
          }
          if (field.type === "date")
            return (
              <Controller
                key={field.name}
                name={field.name as string}
                control={control}
                render={({ field: f }) => (
                  <DatePicker
                    label={field.label}
                    value={f.value}
                    placeholder="Select a date"
                    onSelectDate={(d) => f.onChange(d)}
                  />
                )}
              />
            );
          return null;
        })}
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
              type="number"
              value={entry.amountContested?.toString() || ""}
              styles={{ root: { flex: 1 } }}
              onChange={(_, v) => {
                const updated = [...taxIssueEntries];
                updated[idx].amountContested = v ? parseFloat(v) : 0;
                setTaxIssueEntries(updated);
              }}
            />

            {/* Gross Tax Exposure */}
            <TextField
              label="Gross Tax Exposure"
              placeholder="Gross Tax Exposure"
              type="number"
              value={entry.grossTaxExposure?.toString() || ""}
              styles={{ root: { flex: 1 } }}
              onChange={(_, v) => {
                const updated = [...taxIssueEntries];
                updated[idx].grossTaxExposure = v ? parseFloat(v) : 0;
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
