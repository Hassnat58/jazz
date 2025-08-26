/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useEffect, useState } from "react";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import { Button } from "react-bootstrap";
import styles from "./TabedTables.module.scss";
import RoleDetailsDrawer from "./RoleDetailoffcanvas";

interface IManageRoleProps {
  SpfxContext: any;
}

const ManageRole: React.FC<IManageRoleProps> = ({ SpfxContext }) => {
  const [roleData, setRoleData] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const sp = spfi().using(SPFx(SpfxContext));

  const loadRoleData = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle("Role")
        .items.select(
          "*,Id,Role,Person/Title,Person/EMail,Author/Title,Author/EMail,Modified"
        )
        .expand("Person,Author")();

      const mapped: any[] = [];
      items.forEach((item: any) => {
        const roles = Array.isArray(item.Role) ? item.Role : [item.Role];
        roles.forEach((r: string) => {
          mapped.push({
            ItemId: item.Id,
            Person: item?.Person?.Title || "",
            PersonEmail: item?.Person?.EMail || "",
            Role: r,
          });
        });
      });

      setRoleData(mapped);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const handleView = (row: any) => {
    setSelectedRow(row);
    setShowDrawer(true);
  };

  useEffect(() => {
    loadRoleData();
  }, []);

  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Person</th>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {roleData.map((row, index) => (
            <tr key={`${row.ItemId}-${index}`}>
              <td>{index + 1}</td>
              <td>{row.Person}</td>
              <td>{row.PersonEmail}</td>
              <td>{row.Role}</td>
              <td>
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={() => handleView(row)}
                >
                  👁
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showDrawer && selectedRow && (
        <RoleDetailsDrawer
          show={showDrawer}
          onHide={() => setShowDrawer(false)}
          roleData={selectedRow}
          SpfxContext={SpfxContext}
          reloadRoles={loadRoleData}
        />
      )}
    </>
  );
};

export default ManageRole;
