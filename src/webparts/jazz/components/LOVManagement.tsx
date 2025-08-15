/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import styles from "./TabedTables.module.scss";
import { spfi, SPFx } from "@pnp/sp";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import LOVDetailsDrawer from "./LOVDetailsDrawer";

const LOVManagement: React.FC<{ SpfxContext: any }> = ({ SpfxContext }) => {
  const [selectedLOV, setSelectedLOV] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [lovData, setLOVData] = useState<any[]>([]);
  const sp = spfi().using(SPFx(SpfxContext));

  const loadLoVData = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle("LOV Data")
        .items.select(
          "*",
          "ID",
          "Title",
          "Description",
          "Status",
          "Author/Title",
          "Author/ID",
          //   "Editor/Title",
          //   "Editor/ID",
          "Modified/Title",
          "Modified/ID"
        )
        .expand("Author")
        .orderBy("ID", false)();
      setLOVData(items);
      console.log("LOV data:", items);
    } catch (err) {
      console.error("Error fetching data from LOV list:", err);
    }
  };

  const handleView = (item: any) => {
    setSelectedLOV(item);
    setShowDrawer(true);
  };
  useEffect(() => {
    loadLoVData();
  }, []);

  return (
    <>
      <h4>Content area</h4>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>S.No</th>
            <th>LOV Type</th>
            <th>Description</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {lovData.map((item, index) => (
            <tr key={item.ID}>
              <td>{index + 1}</td>
              <td>{item.Title}</td>
              <td>{item.Description}</td>
              <td>{item.Status}</td>
              <td>
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={() => handleView(item)}
                >
                  👁
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <LOVDetailsDrawer
        show={showDrawer}
        SpfxContext={SpfxContext}
        onHide={() => setShowDrawer(false)}
        LOVData={selectedLOV}
        loadLOVData={loadLoVData}
      />
    </>
  );
};

export default LOVManagement;
