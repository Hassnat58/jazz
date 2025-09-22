/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import styles from "./TabedTables.module.scss";
import { spfi, SPFx } from "@pnp/sp";
import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap"; // ← added Form from react-bootstrap
import LOVForm from "./LOVForm";

const LOVManagement: React.FC<{ SpfxContext: any }> = ({ SpfxContext }) => {
  const [selectedLOV, setSelectedLOV] = useState<any | null>(null);
  const [lovData, setLOVData] = useState<any[]>([]);
  const [formOptions, setFormOptions] = useState<string[]>([]); // ← added
  const [selectedForm, setSelectedForm] = useState<string>(""); // ← added
  const [showForm, setShowForm] = useState(false);

  const sp = spfi().using(SPFx(SpfxContext));

  const loadLoVData = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle("LOVData1")
        .items.select(
          "ID",
          "Title",
          "Value",
          "Status",
          "Form",
          "Parent/Title",
          "Parent/ID",
          "Parent/Value"
        )
        .expand("Parent")
        .orderBy("ID", false)(); // we still fetch ordered by ID

      // ✅ distinct titles logic stays exactly the same
      const seenTitles = new Set();
      const distinctItems = items.filter((item) => {
        if (seenTitles.has(item.Title)) return false;
        seenTitles.add(item.Title);
        return true;
      });

      // ✅ now sort alphabetically by Title (or Value if you prefer)
      const sortedDistinctItems = [...distinctItems].sort(
        (a, b) => a.Title.localeCompare(b.Title) // sort by Title
      );

      setLOVData(sortedDistinctItems);

      // ✅ forms still derived from distinctItems
      const forms = Array.from(
        new Set(sortedDistinctItems.map((i) => i.Form).filter(Boolean))
      );
      setFormOptions(forms);
    } catch (err) {
      console.error("Error fetching data from LOV list:", err);
    }
  };

  useEffect(() => {
    loadLoVData();
  }, []);

  const handleEdit = (item: any) => {
    setSelectedLOV(item);
    setShowForm(true);
  };

  // Filter rows by selected Form
  const filteredData = selectedForm
    ? lovData.filter((item) => item.Form === selectedForm)
    : lovData;

  return (
    <>
      {/* --- Label + Dropdown above the table --- */}
      {!showForm && (
        <div style={{ marginBottom: "15px" }}>
          <Form.Group style={{ width: "250px" }}>
            <Form.Label style={{ fontWeight: "bold" }}>Forms</Form.Label>
            <Form.Select
              style={{ width: "250px" }}
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
            >
              <option value="">All Forms</option>
              {formOptions.map((formName) => (
                <option key={formName} value={formName}>
                  {formName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
      )}

      {/* --- Table --- */}
      {!showForm && (
        <table className={styles.table} style={{ textAlign: "center" }}>
          <thead>
            <tr>
              <th>S.No</th>
              <th>LOV Type</th>
              <th>Form</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item.ID}>
                <td>{index + 1}</td>
                <td>{item.Title}</td>
                <td>{item.Form}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="me-2"
                  >
                    ✏
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* --- LOVForm --- */}
      {showForm && (
        <div>
          <LOVForm
            editItem={selectedLOV}
            SpfxContext={SpfxContext}
            onCancel={() => setShowForm(false)}
            onSaved={() => {
              setShowForm(false);
              loadLoVData();
            }}
          />
        </div>
      )}
    </>
  );
};

export default LOVManagement;
