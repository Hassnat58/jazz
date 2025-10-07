/* eslint-disable react/self-closing-comp */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useEffect, useState } from "react";
import { Card, Button, Alert } from "react-bootstrap";
import { spfi, SPFx } from "@pnp/sp";
import { Label } from "@fluentui/react";

interface LOVFormProps {
  onCancel: () => void;
  onSaved?: () => void;
  SpfxContext: any;
  editItem: any; // selected item
}

interface LOVValue {
  Id?: number;
  Value: string;
  Status: string;
}

const LOVForm: React.FC<LOVFormProps> = ({
  onCancel,
  onSaved,
  SpfxContext,
  editItem,
}) => {
  const sp = spfi().using(SPFx(SpfxContext));

  const [_allItems, setAllItems] = useState<any[]>([]);
  const [lovValues, setLovValues] = useState<LOVValue[]>([]);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: string;
    text: string;
  } | null>(null);

  const statusOptions = ["Active", "Inactive"];

  // Load all items
  // Load all items
  const loadData = async () => {
    try {
      setIsLoading(true);
      const items = await sp.web.lists
        .getByTitle("LOVData1")
        .items.select("Id", "Title", "Form", "Value", "Status")
        .top(5000)();

      setAllItems(items);
      console.log("All Items:", items);
      console.log("Editing:", editItem.Title, editItem.Form);

      const filtered = items.filter((i) => i.Title === editItem.Title);

      const mapped = filtered.map((i) => ({
        Id: i.Id,
        Value: i.Value,
        Status: i.Status,
      }));

      setLovValues(mapped);
      setRowErrors(mapped.map(() => ""));
    } catch (err) {
      console.error(err);
      setSaveMessage({ type: "danger", text: "Error loading data" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Split existing and new rows
  const existingValues = lovValues.filter((v) => v.Id);
  const newValues = lovValues.filter((v) => !v.Id);

  const sortedExisting = [...existingValues]
    .filter((v) => v.Value.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.Value.localeCompare(b.Value));

  const filteredNewValues = newValues.filter((v) =>
    v.Value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayLovValues = [...sortedExisting, ...filteredNewValues];

  const handleAddNewValue = () => {
    const hasBlank = lovValues.some((v) => !v.Id && v.Value === "");
    if (hasBlank) return;

    setLovValues([...lovValues, { Value: "", Status: "Active" }]);
    setRowErrors([...rowErrors, ""]);
  };

  const validateDuplicate = (index: number, value: string) => {
    const lowerVal = value.trim().toLowerCase();
    const allValuesLower = lovValues.map((v) => v.Value.trim().toLowerCase());
    const isDuplicate = allValuesLower.some(
      (v, i) => i !== index && v === lowerVal
    );
    return isDuplicate ? "Duplicate value" : "";
  };

  const handleValueChange = (
    index: number,
    field: "Value" | "Status",
    val: string
  ) => {
    const displayItem = displayLovValues[index];
    const globalIndex = lovValues.findIndex((lv) => lv.Id === displayItem.Id);

    if (globalIndex !== -1) {
      const updated = [...lovValues];
      updated[globalIndex][field] = val;
      setLovValues(updated);
    } else {
      const newIndex = lovValues.findIndex(
        (lv) => !lv.Id && lv.Value === displayItem.Value
      );
      if (newIndex !== -1) {
        const updated = [...lovValues];
        updated[newIndex][field] = val;
        setLovValues(updated);
      }
    }

    // Duplicate validation for new values
    if (field === "Value") {
      const err = validateDuplicate(index, val);
      const newErrors = [...rowErrors];
      newErrors[index] = err;
      setRowErrors(newErrors);
    }
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSaveMessage(null);

    if (rowErrors.some((err) => err)) {
      setErrorMessage("Please fix duplicate values before saving.");
      return;
    }

    try {
      setIsSaving(true);
      const newItems: any[] = [];

      for (const item of lovValues) {
        if (item.Id) {
          // Update existing item
          await sp.web.lists
            .getByTitle("LOVData1")
            .items.getById(item.Id)
            .update({ Status: item.Status });
        } else if (item.Value.trim() !== "") {
          // Add new item
          const newItem = await sp.web.lists.getByTitle("LOVData1").items.add({
            Title: editItem.Title,
            Form: editItem.Form,
            Value: item.Value.trim(),
            Status: item.Status,
          });

          // ✅ Safely handle either structure
          const newId = newItem?.data?.Id || newItem?.Id;

          // ✅ Instantly reflect new item in UI
          newItems.push({
            Id: newId,
            Value: item.Value.trim(),
            Status: item.Status,
          });
        }
      }

      if (newItems.length > 0) {
        setLovValues((prev) => [...prev, ...newItems]);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadData();

      setSaveMessage({ type: "success", text: "Values saved successfully!" });
      onSaved?.();
    } catch (err) {
      console.error("Error in handleSave:", err);
      setSaveMessage({ type: "danger", text: "Error saving values" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-3 text-center">Loading...</div>;

  return (
    <div className="p-3">
      <Card>
        <Card.Header>
          <h5>Edit LOV Values</h5>
          <div>
            <strong>Title:</strong> {editItem.Title} | <strong>Form:</strong>{" "}
            {editItem.Form}
          </div>
        </Card.Header>
        <Card.Body>
          {saveMessage && (
            <Alert
              variant={saveMessage.type}
              onClose={() => setSaveMessage(null)}
              dismissible
            >
              {saveMessage.text}
            </Alert>
          )}
          {errorMessage && (
            <Alert
              variant="danger"
              onClose={() => setErrorMessage(null)}
              dismissible
            >
              {errorMessage}
            </Alert>
          )}

          <Label>Search Values:</Label>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Search values..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "300px" }}
          />

          <table className="table table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayLovValues.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="text"
                      className={`form-control ${
                        !item.Id && rowErrors[index] ? "is-invalid" : ""
                      }`}
                      value={item.Value}
                      onChange={(e) =>
                        handleValueChange(index, "Value", e.target.value)
                      }
                      readOnly={!!item.Id}
                      placeholder={item.Id ? "" : "Enter new value"}
                    />
                    {!item.Id && rowErrors[index] && (
                      <div className="text-danger small">
                        {rowErrors[index]}
                      </div>
                    )}
                  </td>

                  <td>
                    <select
                      className="form-select"
                      value={item.Status}
                      onChange={(e) =>
                        handleValueChange(index, "Status", e.target.value)
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Button
            variant="outline-primary"
            onClick={handleAddNewValue}
            className="mb-3"
          >
            Add New Value
          </Button>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onCancel} className="me-2">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving || rowErrors.some((err) => err)}
            >
              {isSaving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Saving...
                </>
              ) : (
                "Save Values"
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LOVForm;
