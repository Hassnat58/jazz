/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Offcanvas, Button, Row, Col } from "react-bootstrap";
import { spfi, SPFx } from "@pnp/sp";
import styles from "../components/ManagerDetailsDrawer.module.scss";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import jazzLogo from "../assets/jazz-logo.png";

interface Props {
  show: boolean;
  onHide: () => void;
  roleData: any;
  SpfxContext: any;
  reloadRoles: () => void;
}

const RoleDetailsDrawer: React.FC<Props> = ({
  show,
  onHide,
  roleData,
  SpfxContext,
  reloadRoles,
}) => {
  const sp = spfi().using(SPFx(SpfxContext));

  if (!roleData) return null;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    try {
      await sp.web.lists
        .getByTitle("Role")
        .items.getById(roleData.ItemId)
        .delete();

      reloadRoles(); // reload data in ManageRole
      onHide();
      alert("Role deleted successfully.");
    } catch (err) {
      console.error("Delete failed", err);
      alert("Error deleting the role.");
    }
  };

  return (
    <Offcanvas
      className={styles.viewCaseContainer}
      show={show}
      onHide={onHide}
      placement="end"
      backdrop={true}
      style={{ width: "600px" }}
    >
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
        <div className="d-flex gap-2">
          <Button variant="light" size="sm" onClick={onHide}>
            Close
          </Button>
        </div>
      </div>

      <Offcanvas.Body className="pt-3">
        <div className={styles.header}>
          <img src={jazzLogo} alt="Jazz Logo" className={styles.logo} />
          <h6 className="mt-2 fw-bold">Role Details</h6>
        </div>
        <Row className={`mt-4 mb- ${styles.custombg}`}>
          <Col>
            <span className="text-seconday">Role</span>
            <div>
              <strong>{roleData.Role}</strong>
            </div>
          </Col>
          <Col>
            <span className="text-seconday">Last Updated</span>
            <div>
              <strong>
                {new Date(roleData.Modified)
                  .toLocaleDateString("en-US")
                  .replace(/\//g, "-")}
              </strong>
            </div>
          </Col>
          <Col>
            <span className="text-seconday">Owner</span>
            <div>
              <b>{roleData.Author?.Title}</b>
            </div>
          </Col>
        </Row>

        <table className="table table-bordered small">
          <tbody>
            <tr>
              <td className="text-#6C757D">
                <strong>Role:</strong>
              </td>
              <td>{roleData.Role}</td>
            </tr>
            <tr>
              <td>
                <strong>Person</strong>
              </td>
              <td colSpan={3}>{roleData.Person}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 d-flex justify-content-end gap-2">
          <Button variant="danger" onClick={handleDelete}>
            🗑 Delete
          </Button>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default RoleDetailsDrawer;
