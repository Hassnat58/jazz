/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";
import styles from "./CaseForm.module.scss";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";

interface RoleFormProps {
  onCancel: () => void;
  SpfxContext: any;
  editItem?: any; // <-- NEW: optional edit item
  reloadRoles?: () => void; // <-- NEW: callback to refresh table
}

const RoleForm: React.FC<RoleFormProps> = ({
  onCancel,
  SpfxContext,
  editItem,
  reloadRoles,
}) => {
  const { handleSubmit, control, reset, setValue } = useForm();
  const [roleChoices, setRoleChoices] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const sp = spfi().using(SPFx(SpfxContext));

  // Load Role choices from the "Role" choice column
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const roleField: any = await sp.web.lists
          .getByTitle("Role")
          .fields.getByInternalNameOrTitle("Role")
          .select("Choices")();
        setRoleChoices(roleField?.Choices || []);
      } catch (err) {
        console.error("Error loading role choices:", err);
      }
    };
    loadRoles();
  }, []);

  // Pre-fill data when editing
  useEffect(() => {
    if (editItem) {
      setValue("Role", editItem.Role);
      setSelectedUser([
        {
          id: 1,
          loginName: editItem.PersonEmail,
          text: editItem.Person,
        },
      ]);
    }
  }, [editItem]);

  // Save data to SharePoint
  const onSubmit = async (data: any) => {
    if (!selectedUser || selectedUser.length === 0) {
      alert("Please select a person.");
      return;
    }

    try {
      // Resolve selected person to SharePoint User Id
      const user = await sp.web.ensureUser(selectedUser[0].loginName);

      if (editItem) {
        // 🔹 Update existing record
        await sp.web.lists
          .getByTitle("Role")
          .items.getById(editItem.ItemId)
          .update({
            Role: data.Role,
            PersonId: user.Id,
          });
        alert("Role updated successfully!");
      } else {
        // 🔹 Add new record
        await sp.web.lists.getByTitle("Role").items.add({
          Role: data.Role,
          PersonId: user.Id, // correct numeric ID
        });
        alert("Role assigned successfully!");
      }

      reset();
      setSelectedUser(null);
      onCancel();
      reloadRoles && reloadRoles();
    } catch (err) {
      console.error("Error saving role:", err);
      alert("Error while saving role");
    }
  };

  return (
    <Form className="p-3" onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.topbuttongroup}>
        <button type="button" className={styles.cancelbtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.savebtn}>
          {editItem ? "Update" : "Submit"} {/* Change button text */}
        </button>
      </div>

      <Row>
        {/* People Picker */}
        <Col md={6}>
          <Form.Group>
            <PeoplePicker
              context={SpfxContext}
              titleText="Select Person"
              personSelectionLimit={1}
              groupName={""}
              showtooltip={true}
              required={true}
              ensureUser={true}
              principalTypes={[PrincipalType.User]}
              defaultSelectedUsers={
                editItem ? [editItem.PersonEmail] : [] // Pre-fill when editing
              }
              onChange={(items) => setSelectedUser(items)}
            />
          </Form.Group>
        </Col>

        {/* Role Choice */}
        <Col md={6}>
          <Form.Group>
            <Form.Label>Role *</Form.Label>
            <Controller
              name="Role"
              control={control}
              render={({ field }) => (
                <Form.Select {...field}>
                  <option value="">Select</option>
                  {roleChoices.map((role, i) => (
                    <option key={i} value={role}>
                      {role}
                    </option>
                  ))}
                </Form.Select>
              )}
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default RoleForm;
