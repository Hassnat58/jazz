/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { useEffect, useState } from "react";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import { Button, Modal } from "react-bootstrap";
import styles from "./TabedTables.module.scss";
import RoleDetailsDrawer from "./RoleDetailoffcanvas";
import RoleForm from "./RoleForm";

interface IManageRoleProps {
  SpfxContext: any;
}

const ManageRole: React.FC<IManageRoleProps> = ({ SpfxContext }) => {
  const [roleData, setRoleData] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  // For drawer (view)
  const [showDrawer, setShowDrawer] = useState(false);

  // For modal (edit)
  const [showEditForm, setShowEditForm] = useState(false);

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

  const handleEdit = (row: any) => {
    setSelectedRow(row);
    setShowEditForm(true);
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
                {/* View Button */}
                <Button
                  variant="outline-warning"
                  size="sm"
                  className="me-2"
                  onClick={() => handleView(row)}
                >
                  👁
                </Button>

                {/* Edit Button */}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleEdit(row)}
                >
                  ✏
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* View Drawer */}
      {showDrawer && selectedRow && (
        <RoleDetailsDrawer
          show={showDrawer}
          onHide={() => setShowDrawer(false)}
          roleData={selectedRow}
          SpfxContext={SpfxContext}
          reloadRoles={loadRoleData}
        />
      )}

      {/* Edit Modal */}
      <Modal
        show={showEditForm}
        onHide={() => setShowEditForm(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRow && (
            <RoleForm
              SpfxContext={SpfxContext}
              onCancel={() => setShowEditForm(false)}
              editItem={selectedRow}
              reloadRoles={loadRoleData}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ManageRole;
