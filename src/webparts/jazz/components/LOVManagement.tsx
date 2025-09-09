/* eslint-disable react/self-closing-comp */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import styles from "./TabedTables.module.scss";
import { spfi, SPFx } from "@pnp/sp";
import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import LOVForm from "./LOVForm"; // import your form
import LOVDetailsDrawer from "./LOVDetailsDrawer"; // keep your drawer

const LOVManagement: React.FC<{ SpfxContext: any }> = ({ SpfxContext }) => {
  const [selectedLOV, setSelectedLOV] = useState<any | null>(null);
  const [lovData, setLOVData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

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
          "Parent/Title",
          "Parent/ID",
          "Parent/Value"
        )
        .expand("Parent")
        .orderBy("ID", false)();
      setLOVData(items);
    } catch (err) {
      console.error("Error fetching data from LOV list:", err);
    }
  };

  useEffect(() => {
    loadLoVData();
  }, []);

  const handleView = (item: any) => {
    setSelectedLOV(item);
    setShowDrawer(true);
  };

  const handleEdit = (item: any) => {
    setSelectedLOV(item);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await sp.web.lists.getByTitle("LOVData1").items.getById(id).delete();
      await loadLoVData();
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  return (
    <>
      <h4>Content area</h4>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>S.No</th>
            <th>LOV Type</th>
            <th>Values</th>
            <th>Parent</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {lovData.map((item, index) => (
            <tr key={item.ID}>
              <td>{index + 1}</td>
              <td>{item.Title}</td>
              <td>{item.Value}</td>
              <td>
                {item.Parent
                  ? `${item.Parent.Title} -> ${item.Parent.Value}`
                  : "N/A"}
              </td>
              <td>{item.Status}</td>
              <td>
                {/* View button */}
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={() => handleView(item)}
                  className="me-2"
                >
                  👁
                </Button>

                {/* Edit button */}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleEdit(item)}
                  className="me-2"
                >
                  ✏
                </Button>

                {/* Delete button */}
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(item.ID)}
                  className="me-2"
                >
                  🗑️
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Drawer for view */}
      <LOVDetailsDrawer
        show={showDrawer}
        SpfxContext={SpfxContext}
        onHide={() => setShowDrawer(false)}
        LOVData={selectedLOV}
        loadLOVData={loadLoVData}
      />

      {/* Modal for edit */}
      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg">
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <LOVForm
            mode="edit"
            editItem={selectedLOV}
            SpfxContext={SpfxContext}
            onCancel={() => setShowForm(false)}
            onSaved={() => {
              setShowForm(false);
              loadLoVData();
            }}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default LOVManagement;
