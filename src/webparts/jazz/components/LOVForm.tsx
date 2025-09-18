/* eslint-disable react/self-closing-comp */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useEffect, useState } from "react";
import { Card, Button, Alert } from "react-bootstrap";
import { spfi, SPFx } from "@pnp/sp";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: string;
    text: string;
  } | null>(null);

  const statusOptions = ["Active", "Inactive"];

  // Load all items
  const loadData = async () => {
    try {
      setIsLoading(true);
      const items = await sp.web.lists
        .getByTitle("LOVData1")
        .items.select("Id", "Title", "Form", "Value", "Status")();
      setAllItems(items);

      // Load all values with same Title & Form
      const filtered = items.filter(
        (i) => i.Title === editItem.Title && i.Form === editItem.Form
      );

      setLovValues(
        filtered.map((i) => ({
          Id: i.Id,
          Value: i.Value,
          Status: i.Status,
        }))
      );
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

  const handleAddNewValue = () => {
    setLovValues([...lovValues, { Value: "", Status: "Active" }]);
  };

  // const handleDeleteValue = (index: number) => {
  //   const newValues = [...lovValues];
  //   newValues.splice(index, 1);
  //   setLovValues(newValues);
  // };

  const handleValueChange = (
    index: number,
    field: "Value" | "Status",
    val: string
  ) => {
    const newValues = [...lovValues];
    newValues[index][field] = val;
    setLovValues(newValues);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      for (const item of lovValues) {
        if (item.Id) {
          // update existing
          await sp.web.lists
            .getByTitle("LOVData1")
            .items.getById(item.Id)
            .update({ Value: item.Value, Status: item.Status });
        } else {
          // add new
          await sp.web.lists.getByTitle("LOVData1").items.add({
            Title: editItem.Title,
            Form: editItem.Form,
            Value: item.Value,
            Status: item.Status,
          });
        }
      }
      setSaveMessage({ type: "success", text: "Values saved successfully!" });
      loadData();
      if (onSaved) onSaved();
      setIsSaving(false);
    } catch (err) {
      console.error(err);
      setSaveMessage({ type: "danger", text: "Error saving values" });
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

          <table className="table table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lovValues.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={item.Value}
                      onChange={(e) =>
                        handleValueChange(index, "Value", e.target.value)
                      }
                    />
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
                  {/* <td>
                    {/* <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteValue(index)}
                    >
                      Delete
                    </button> 
                  </td> */}
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
              disabled={isSaving} // disable while saving
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
