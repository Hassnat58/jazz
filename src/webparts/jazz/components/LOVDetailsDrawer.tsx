/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Offcanvas, Button, Row, Col } from "react-bootstrap";
import jazzLogo from "../assets/jazz-logo (1).png";
import styles from "../components/ManagerDetailsDrawer.module.scss";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/attachments";

interface Props {
  show: boolean;
  onHide: () => void;
  LOVData: any;
  SpfxContext: any;
  loadLOVData: any;
}
const LOVDetailsDrawer: React.FC<Props> = ({
  show,
  onHide,
  LOVData,
  SpfxContext,
  loadLOVData,
}) => {
  if (!LOVData) return null;

  return (
    <Offcanvas
      className={styles.viewCaseContainer}
      show={show}
      onHide={onHide}
      placement="end"
      backdrop={true}
      style={{ width: "800px" }}
    >
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
        <div className="d-flex gap-2">
          <Button variant="warning" size="sm">
            📄 Download PDF
          </Button>
          <Button variant="light" size="sm" onClick={onHide}>
            Close
          </Button>
        </div>
      </div>

      <Offcanvas.Body className="pt-3">
        <div className={styles.header}>
          <img src={jazzLogo} alt="Jazz Logo" className={styles.logo} />
          <h6 className="mt-2 fw-bold">LOV Management Details</h6>
        </div>

        <Row className={`mt-4 mb- ${styles.custombg}`}>
          <Col>
            <span className="text-seconday">LOV Type</span>
            <div>
              <strong>{LOVData.Title}</strong>
            </div>
          </Col>
          <Col>
            <span className="text-seconday">Last Updated</span>
            <div>
              <strong>
                {new Date(LOVData.Modified)
                  .toLocaleDateString("en-US")
                  .replace(/\//g, "-")}
              </strong>
            </div>
          </Col>
          <Col>
            <span className="text-seconday">Owner</span>
            <div>
              <b>{LOVData.Author?.Title}</b>
            </div>
          </Col>
        </Row>

        <table className="table table-bordered small">
          <tbody>
            <tr>
              <td className="text-#6C757D">
                <strong>LOV Type:</strong>
              </td>
              <td>{LOVData.Title}</td>
            </tr>
            <tr>
              <td>
                <strong>Description:</strong>
              </td>
              <td colSpan={3}>{LOVData.Description}</td>
            </tr>
            <tr>
              <td>
                <strong>Status:</strong>
              </td>
              <td colSpan={3}>{LOVData.Status}</td>
            </tr>
          </tbody>
        </table>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default LOVDetailsDrawer;
