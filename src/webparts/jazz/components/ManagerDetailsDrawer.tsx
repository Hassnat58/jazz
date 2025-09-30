/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { Offcanvas, Button, Form } from "react-bootstrap";
import { spfi, SPFx } from "@pnp/sp";
import styles from "../components/ManagerDetailsDrawer.module.scss";
import ViewCaseOffcanvas from "./ViewCaseForm";
import ViewUTPForm from "./ViewUTPForm";

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
  const [decision, setDecision] = React.useState<"Approved" | "Rejected">(
    "Approved"
  );
  const [comments, setComments] = React.useState("");
  const sp = spfi().using(SPFx(SpfxContext));
  const [attachments, setAttachments] = React.useState<any[]>([]);

  

  const handleSubmit = async () => {
    if (decision === "Rejected" && comments.trim() === "") {
      alert("Please provide comments for rejection.");
      return;
    }

    try {
      const listName = caseData.type === "utp" ? "UTPData" : "Cases";

      const statusValue = decision === "Approved" ? "Active" : "Inactive";

      await sp.web.lists
        .getByTitle(listName)
        .items.getById(caseData.id)
        .update({
          ApprovalStatus: decision,
          [caseData.type === "utp" ? "Status" : "CaseStatus"]: statusValue,
          [caseData.type === "utp" ? "Description" : "Comments"]: comments,
        });

      loadCasesData();
      onHide();
      setComments("");
      setDecision("Approved");

      alert(
        `${caseData.type === "utp" ? "UTP" : "Case"} ${
          decision === "Approved" ? "approved" : "rejected"
        } successfully.`
      );
    } catch (error) {
      console.error("Update failed", error);
      alert("Error updating the record.");
    }
  };
  const fetchAttachments = async (
    itemId: number,
    type: "case" | "correspondenceOut" | "UTP"
  ) => {
    try {
      let filter = "";

      if (type === "case") {
        filter = `CaseId eq ${itemId}`;
      } else if (type === "correspondenceOut") {
        filter = `CorrespondenceOutId eq ${itemId}`;
      } else if (type === "UTP") {
        filter = `UTPId eq ${itemId}`;
      }

      const files = await sp.web.lists
        .getByTitle("Core Data Repositories")
        .items.filter(filter)
        .select("File/Name", "File/ServerRelativeUrl", "ID")
        .expand("File")();
      setAttachments(files);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };
 React.useEffect(() => {
  if (caseData && caseData.id) {
    fetchAttachments(caseData.id, caseData.type === "utp" ? "UTP" : "case");
  }
}, [caseData]); 
if (!caseData) return null;
  return (
    <Offcanvas
      className={styles.viewCaseContainer}
      show={show}
      onHide={onHide}
      placement="end"
      backdrop={true}
      style={{ width: "900px" }}
    >
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
        <h6 className="m-0">{caseData.caseNo}</h6>
        <Button variant="light" size="sm" onClick={onHide}>
          Close
        </Button>
      </div>

      <Offcanvas.Body className="pt-3">
        {/* ✅ Render respective detailed drawer inside Manager */}
        {caseData.type === "utp" ? (
          <ViewUTPForm
            show={true}
            onClose={() => {}}
            utpData={caseData.raw}
            attachments={attachments}
          />
        ) : (
          <ViewCaseOffcanvas
            show={true}
            onClose={() => {}}
            caseData={caseData.raw}
            attachments={attachments}
          />
        )}

        {/* ✅ Keep Approve/Reject section same */}
        <hr />
        <h6 className="fw-bold mt-3">Manager Decision</h6>
        <Form.Group>
          <div className="d-flex gap-3">
            <Form.Check
              label="Approve"
              name="decision"
              type="radio"
              checked={decision === "Approved"}
              onChange={() => setDecision("Approved")}
            />
            <Form.Check
              label="Reject"
              name="decision"
              type="radio"
              checked={decision === "Rejected"}
              onChange={() => setDecision("Rejected")}
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
          <Button variant="warning" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default ManagerDetailsDrawer;
