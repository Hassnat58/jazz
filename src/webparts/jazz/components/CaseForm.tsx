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
import "@pnp/sp/attachments";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { TextField } from "@fluentui/react/lib/TextField";
import { DatePicker } from "@fluentui/react/lib/DatePicker";

interface CaseFormProps {
  onCancel: () => void;
  onSave: (data: any) => void;
  SpfxContext: any;
  selectedCase?: any;
}

const CaseForm: React.FC<CaseFormProps> = ({
  SpfxContext,
  onCancel,
  onSave,
  selectedCase,
}) => {
  const { control, handleSubmit, reset, getValues } = useForm();

  const [lovOptions, setLovOptions] = useState<{
    [key: string]: IDropdownOption[];
  }>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const sp = spfi().using(SPFx(SpfxContext));

  const fieldMapping: { [key: string]: string } = {
    Entity: "Entity",
    TaxAuthority: "TaxAuthority",
    Jurisdiction: "Jurisdiction",
    "Concerning Law": "ConcerningLaw",
    "Correspondence Type": "CorrespondenceType",
    IssuedBy: "IssuedBy",
    "Next Forum/Pending Authority": "NextForum_x002f_PendingAuthority",
    "Tax exposure Stage": "TaxexposureStage",
    "Case Status": "CaseStatus",
    "Tax Consultant Assigned": "TaxConsultantAssigned",
    "Lawyer Assigned": "LawyerAssigned",
    "Exposure Issues": "Exposure_x0020_Issues",
  };

  const dropdownFields = Object.keys(fieldMapping);

  const inputFields = [
    { label: "Document Reference No.", name: "DocumentReferenceNo" },
    { label: "Financial Year", name: "FinancialYear" },
    { label: "Gross Tax Demanded/Exposure", name: "GrossTaxDemanded" },
    { label: "Email – Title", name: "Email" },
    { label: "Brief Description", name: "BriefDescription" },
  ];

  const dateFields = [
    { label: "Date of Document", name: "Dateofdocument" },
    { label: "Date Received", name: "DateReceived" },
    { label: "Date of Compliance", name: "DateofCompliance" },
    { label: "Hearing Date", name: "Hearingdate" },
  ];

  const fieldOrder = [
    {
      type: "input",
      label: "Document Reference No.",
      name: "DocumentReferenceNo",
    },
    { type: "dropdown", label: "Entity" },
    { type: "dropdown", label: "TaxAuthority" },
    { type: "dropdown", label: "Jurisdiction" },
    { type: "dropdown", label: "Concerning Law" },
    { type: "dropdown", label: "Correspondence Type" },
    { type: "dropdown", label: "IssuedBy" },
    { type: "date", label: "Date of Document", name: "Dateofdocument" },
    { type: "date", label: "Date Received", name: "DateReceived" },
    { type: "dropdown", label: "Next Forum/Pending Authority" },
    { type: "date", label: "Date of Compliance", name: "DateofCompliance" },
    { type: "date", label: "Hearing Date", name: "Hearingdate" },
    { type: "input", label: "Financial Year", name: "FinancialYear" },
    { type: "dropdown", label: "Tax exposure Stage" },
    { type: "dropdown", label: "Case Status" },
    { type: "dropdown", label: "Tax Consultant Assigned" },
    { type: "dropdown", label: "Lawyer Assigned" },
    {
      type: "input",
      label: "Gross Tax Demanded/Exposure",
      name: "GrossTaxDemanded",
    },
    { type: "input", label: "Email – Title", name: "Email" },
  ];

  const multilineFields = [
    { label: "Brief Description", name: "BriefDescription" },
    { label: "Case Brief Description", name: "CaseBriefDescription" },
  ];

  useEffect(() => {
    const fetchLOVs = async () => {
      const items = await sp.web.lists
        .getByTitle("LOV Data")
        .items.select("Title", "Description", "Status")();
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
  }, []);
  useEffect(() => {
    if (selectedCase) {
      const prefilledValues: any = {};

      dropdownFields.forEach((label) => {
        const internalName = fieldMapping[label];
        prefilledValues[internalName] = selectedCase[internalName] || "";
      });

      inputFields.forEach(({ name }) => {
        prefilledValues[name] = selectedCase[name] || "";
      });

      dateFields.forEach(({ name }) => {
        const dateStr = selectedCase[name];
        prefilledValues[name] = dateStr ? new Date(dateStr) : null;
      });

      multilineFields.forEach(({ name }) => {
        prefilledValues[name] = selectedCase[name] || "";
      });

      prefilledValues["CaseNumber"] = selectedCase["ID"] || "";

      reset(prefilledValues);
    }
  }, [selectedCase, reset]);

  const submitForm = async (isDraft: boolean) => {
    const data = getValues();
    const itemData: any = {
      Title: data.CaseNumber || "",
      IsDraft: isDraft,
    };

    dropdownFields.forEach((field) => {
      const internalName = fieldMapping[field];
      itemData[internalName] = data[internalName] || "";
    });

    inputFields.forEach(({ name }) => {
      if (name === "GrossTaxDemanded") {
        itemData[name] = parseFloat(data[name]) || 0;
      } else {
        itemData[name] = data[name] || "";
      }
    });

    dateFields.forEach(({ name }) => {
      itemData[name] = data[name] || null;
    });

    multilineFields.forEach(({ name }) => {
      itemData[name] = data[name] || "";
    });

    try {
      let itemId;

      if (selectedCase && selectedCase.ID) {
        await sp.web.lists
          .getByTitle("Cases")
          .items.getById(selectedCase.ID)
          .update({
            ...itemData,
          });
        itemId = selectedCase.ID;
      } else {
        const addResult = await sp.web.lists.getByTitle("Cases").items.add({
          ...itemData,
          CaseStatus: "Active",
        });
        itemId = addResult.ID;
      }

      // Upload file if selected
      if (selectedFile) {
        await sp.web.lists
          .getByTitle("Cases")
          .items.getById(itemId)
          .attachmentFiles.add(selectedFile.name, selectedFile);
      }

      alert(
        isDraft
          ? "Saved as Draft!"
          : selectedCase
          ? "Updated successfully!"
          : "Saved successfully!"
      );
      onSave(data);
      reset();
      setSelectedFile(null);
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

  return (
    <form
      onSubmit={handleSubmit(() => submitForm(false))}
      style={{ marginTop: "1rem" }}
    >
      <div style={formStyle}>
        {fieldOrder.map((field) => {
          if (field.type === "input") {
            return (
              <Controller
                key={field.name}
                name={field.name as string}
                control={control}
                render={({ field: inputField }) => (
                  <TextField
                    label={field.label}
                    {...inputField}
                    type={field.name === "GrossTaxDemanded" ? "number" : "text"}
                  />
                )}
              />
            );
          }

          if (field.type === "dropdown") {
            const internalName = fieldMapping[field.label];
            return (
              <Controller
                key={field.label}
                name={internalName}
                control={control}
                render={({ field: dropdownField }) => (
                  <Dropdown
                    label={field.label}
                    placeholder={`Select ${field.label}`}
                    options={lovOptions[field.label] || []}
                    selectedKey={dropdownField.value}
                    onChange={(_, option) =>
                      dropdownField.onChange(option?.key)
                    }
                  />
                )}
              />
            );
          }

          if (field.type === "date") {
            return (
              <Controller
                key={field.name}
                name={field.name as string}
                control={control}
                render={({ field: dateField }) => (
                  <DatePicker
                    label={field.label}
                    value={dateField.value}
                    onSelectDate={(date) => dateField.onChange(date)}
                  />
                )}
              />
            );
          }

          return null;
        })}

        {/* File Upload */}
        <div style={{ gridColumn: "span 3" }}>
          <label style={{ fontWeight: 600 }}>Attachment</label>
          <br />
          <input
            type="file"
            accept="*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          {selectedFile && (
            <div style={{ marginTop: "0.5rem" }}>
              <span>{selectedFile.name}</span> &nbsp;
              <span style={{ color: "gray", fontSize: "0.85rem" }}>
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}
        </div>

        {/* Multiline Fields */}
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
                rows={4}
                styles={{ root: { gridColumn: "span 3" } }}
              />
            )}
          />
        ))}
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit">{selectedCase ? "Update" : "Save"}</button>
        <button type="button" onClick={() => submitForm(true)}>
          Save as Draft
        </button>
      </div>
    </form>
  );
};

export default CaseForm;
