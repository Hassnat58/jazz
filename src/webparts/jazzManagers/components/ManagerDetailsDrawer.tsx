/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Offcanvas, Button, Form, Row, Col } from "react-bootstrap";
import jazzLogo from "../assets/jazz-logo.png";
import styles from "./ManagerDetailsDrawer.module.scss";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/attachments";

interface Props {
  show: boolean;
  onHide: () => void;
  caseData: any;
  SpfxContext: any;
  loadCasesData: any;
}
const ManagerDetailsDrawer: React.FC<Props> = ({
  show,
  onHide,
  caseData,
  SpfxContext,
  loadCasesData,
}) => {
  const [decision, setDecision] = React.useState<"Approve" | "Reject">(
    "Approve"
  );
  const [comments, setComments] = React.useState("");
  const sp = spfi().using(SPFx(SpfxContext));

  if (!caseData) return null;
  const handleSubmit = async () => {
    if (decision === "Reject" && comments.trim() === "") {
      alert("Please provide comments for rejection.");
      return;
    }

    try {
      await sp.web.lists
        .getByTitle("Cases")
        .items.getById(caseData.ID)
        .update({
          CaseStatus: decision,
          Comments: comments || "",
        });

      loadCasesData();
      onHide();
      alert(
        `Case ${decision === "Approve" ? "approved" : "rejected"} successfully.`
      );
    } catch (error) {
      console.error("Update failed", error);
      alert("Error updating the case.");
    }
  };
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
        <h6 className="m-0">CN-00{caseData.ID}</h6>
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
          <h6 className="mt-2 fw-bold">Managers Details</h6>
        </div>

        <Row className={`mt-4 mb- ${styles.custombg}`}>
          <Col>
            <span className="text-seconday">Authority</span>
            <div>
              <strong>{caseData.TaxAuthority}</strong>
            </div>
          </Col>
          <Col>
            <span className="text-seconday">Last Updated</span>
            <div>
              <strong>
                {new Date(caseData.DateofCompliance)
                  .toLocaleDateString("en-US")
                  .replace(/\//g, "-")}
              </strong>
            </div>
          </Col>
          <Col>
            <span className="text-seconday">Owner</span>
            <div>
              <b>{caseData.TaxConsultantAssigned}</b>
            </div>
          </Col>
        </Row>

        <table className="table table-bordered small">
          <tbody>
            <tr>
              <td className="text-#6C757D">
                <strong>Jurisdiction:</strong>
              </td>
              <td>{caseData.Jurisdiction}</td>
              <td>
                <strong>Consultant:</strong>
              </td>
              <td>{caseData.TaxConsultantAssigned}</td>
            </tr>
            <tr>
              <td>
                <strong>Brief Description:</strong>
              </td>
              <td colSpan={3}>{caseData.BriefDescription}</td>
            </tr>
            <tr>
              <td>
                <strong>Complain:</strong>
              </td>
              <td colSpan={3}>{caseData.CaseStatus}</td>
            </tr>
          </tbody>
        </table>

        <Form.Group>
          <div className="d-flex gap-3">
            <Form.Check
              label="Approve"
              name="decision"
              type="radio"
              checked={decision === "Approve"}
              onChange={() => setDecision("Approve")}
            />
            <Form.Check
              label="Reject"
              name="decision"
              type="radio"
              checked={decision === "Reject"}
              onChange={() => setDecision("Reject")}
            />
          </div>
        </Form.Group>

        <Form.Group className="mt-3">
          <Form.Label className="text-danger fw-semibold">* </Form.Label>
          Comments
          <Form.Control
            as="textarea"
            rows={4}
            maxLength={1000}
            placeholder="Allowed 1000 characters only"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </Form.Group>

        <div className="mt-4 d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="warning" onClick={() => handleSubmit()}>
            Submit
          </Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default ManagerDetailsDrawer;
