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

interface ConsultantProps {
  onCancel: () => void;
  onSaved?: () => void;
  SpfxContext: any;
}

interface Consultant {
  Id?: number;
  Title: string;
  Email: string;
  Status: string;
}

const Consultant: React.FC<ConsultantProps> = ({
  onCancel,
  onSaved,
  SpfxContext,
}) => {
  const sp = spfi().using(SPFx(SpfxContext));

  const [consultants, setConsultants] = useState<Consultant[]>([]);
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

  // 🔹 Load Tax Consultant list data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const items = await sp.web.lists
        .getByTitle("Tax Consultant")
        .items.select("Id", "Title", "Email", "Status")
        .top(5000)();

      const mapped = items.map((i) => ({
        Id: i.Id,
        Title: i.Title,
        Email: i.Email,
        Status: i.Status,
      }));

      setConsultants(mapped);
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

  const existingValues = consultants.filter((c) => c.Id);
  const newValues = consultants.filter((c) => !c.Id);

  const filteredExisting = existingValues.filter(
    (c) =>
      c.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.Email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNewValues = newValues.filter(
    (c) =>
      c.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.Email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayConsultants = [...filteredExisting, ...filteredNewValues];

  // 🔹 Add new row
  const handleAddNewConsultant = () => {
    const hasBlank = consultants.some(
      (c) => !c.Id && (c.Title === "" || c.Email === "")
    );
    if (hasBlank) return;

    setConsultants([
      ...consultants,
      { Title: "", Email: "", Status: "Active" },
    ]);
    setRowErrors([...rowErrors, ""]);
  };

  // 🔹 Validate duplicate (Title + Email)
  const validateDuplicate = (
    field: "Title" | "Email",
    index: number,
    value: string
  ) => {
    const lowerVal = value.trim().toLowerCase();
    const allValuesLower = consultants.map((c) =>
      (field === "Title" ? c.Title : c.Email).trim().toLowerCase()
    );
    const isDuplicate = allValuesLower.some(
      (v, i) => i !== index && v === lowerVal
    );

    return isDuplicate ? `${field} already exists` : "";
  };

  const handleChange = (
    index: number,
    field: keyof Consultant,
    val: string
  ) => {
    const currentItem = displayConsultants[index];
    const globalIndex = consultants.findIndex(
      (c) => c.Id === currentItem.Id && c.Email === currentItem.Email
    );

    if (globalIndex !== -1) {
      const newArr = [...consultants];
      (newArr[globalIndex] as any)[field] = val;
      setConsultants(newArr);

      // 🔹 Validate duplicates only for new items
      if (!newArr[globalIndex].Id && (field === "Title" || field === "Email")) {
        const err = validateDuplicate(field, globalIndex, val);
        const newErrors = [...rowErrors];
        newErrors[globalIndex] = err;
        setRowErrors(newErrors);
      }
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

      for (const item of consultants) {
        if (item.Id) {
          // ✅ Update only status
          await sp.web.lists
            .getByTitle("Tax Consultant")
            .items.getById(item.Id)
            .update({ Status: item.Status });
        } else {
          // ✅ Add new consultant
          if (!item.Title || !item.Email) continue;

          await sp.web.lists.getByTitle("Tax Consultant").items.add({
            Title: item.Title,
            Email: item.Email,
            Status: item.Status,
          });
        }
      }

      setSaveMessage({ type: "success", text: "Saved successfully!" });
      loadData();
      onSaved?.();
    } catch (err) {
      console.error(err);
      setSaveMessage({ type: "danger", text: "Error saving data" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-3 text-center">Loading...</div>;

  return (
    <div className="p-3">
      <Card>
        <Card.Header>
          <h5>Manage Tax Consultants</h5>
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

          <Label>Search:</Label>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "300px" }}
          />

          <table className="table table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Consultant Name</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayConsultants.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="text"
                      className={`form-control ${
                        !item.Id &&
                        rowErrors[index] &&
                        rowErrors[index].includes("Title")
                          ? "is-invalid"
                          : ""
                      }`}
                      value={item.Title}
                      onChange={(e) =>
                        handleChange(index, "Title", e.target.value)
                      }
                      readOnly={!!item.Id}
                      placeholder="Enter consultant name"
                    />
                    {!item.Id &&
                      rowErrors[index] &&
                      rowErrors[index].includes("Title") && (
                        <div className="text-danger small">
                          {rowErrors[index]}
                        </div>
                      )}
                  </td>
                  <td>
                    <input
                      type="email"
                      className={`form-control ${
                        !item.Id &&
                        rowErrors[index] &&
                        rowErrors[index].includes("Email")
                          ? "is-invalid"
                          : ""
                      }`}
                      value={item.Email}
                      onChange={(e) =>
                        handleChange(index, "Email", e.target.value)
                      }
                      readOnly={!!item.Id}
                      placeholder="Enter consultant email"
                    />
                    {!item.Id &&
                      rowErrors[index] &&
                      rowErrors[index].includes("Email") && (
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
                        handleChange(index, "Status", e.target.value)
                      }
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
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
            onClick={handleAddNewConsultant}
            className="mb-3"
          >
            Add New Consultant
          </Button>

          <div className="d-flex justify-content-end">
            {/* <Button variant="secondary" onClick={onCancel} className="me-2">
              Cancel
            </Button> */}
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
                "Save"
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Consultant;
