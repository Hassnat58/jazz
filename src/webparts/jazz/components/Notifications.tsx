/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { useState, useEffect } from "react";
import { spfi, SPFx } from "@pnp/sp"; // already in your imports
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import jazzLogo from "../assets/jazz-logo.png";
import { Offcanvas, Button, Badge, Row, Col } from "react-bootstrap";
import styles from "./Notifications.module.scss";

interface Notification {
  id: number;
  title: string;
  description: string; // will map from Content
  time: string; // derived from ReceivedDate
  from: string; // maps from Sender
  date: string; // maps from ReceivedDate
  reference: string; // maps from LinkedCaseID
  body: string; // maps from Content
  attachments: string[];
  status: "unread" | "read";
}

interface NotificationsProps {
  newAdd: () => void;
  activeForm: () => void;
  SpfxContext: any;
  setNotiID: any;
  setSelectedCase: any;
  setExisting: any;
}

const Notifications: React.FC<NotificationsProps> = ({
  newAdd,
  activeForm,
  SpfxContext,
  setNotiID,
  setSelectedCase,
  setExisting,
}) => {
  const [show, setShow] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("read");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  //     const fetchCaseByNotification = async (notiId: number) => {
  //   try {
  //     const sp = spfi().using(SPFx(SpfxContext));

  //     // query the Cases list for case where NotiLinkedId = notiId
  //     const items = await sp.web.lists
  //       .getByTitle("Cases")
  //         .items.select(
  //           "*",
  //           "ID",
  //           "Title",
  //           "CorrespondenceType",
  //           "DateReceived",
  //           "FinancialYear",
  //           "DateofCompliance",
  //           "LawyerAssigned/Title",
  //           "GrossTaxDemanded",
  //           "CaseStatus",
  //           "Author/Title",
  //           "Editor/Title"
  //         )
  //         .expand("Author", "Editor", "LawyerAssigned")
  //       .filter(`LinkedNotificationIDId eq ${notiId}`)();

  //     if (items.length > 0) {
  //       return items[0]; // return first matched case
  //     }
  //     return null;
  //   } catch (err) {
  //     console.error("Error fetching case:", err);
  //     return null;
  //   }
  // };

  const fetchInboxData = async () => {
    try {
      const sp = spfi().using(SPFx(SpfxContext));
      const items = await sp.web.lists
        .getByTitle("Inbox")
        .items.select("*")
        .expand("AttachmentFiles")();

      const mapped: Notification[] = items.map((item: any) => ({
        id: item.Id,
        title: item.Title || "",
        description: item.Content ? item.Content.substring(0, 100) + "..." : "",
        time: item.ReceivedDate
          ? new Date(item.ReceivedDate).toLocaleTimeString()
          : "",
        from: item.Sender || "",
        date: item.ReceivedDate || "",
        reference: item.LinkedCaseIDId || "",
        body: item.Content || "",
        attachments: item.AttachmentFiles
          ? item.AttachmentFiles.map((f: any) => f.FileName)
          : [],
        status: item.Status?.toLowerCase() === "read" ? "read" : "unread",
      }));

      setNotifications(mapped);
    } catch (err) {
      console.error("Error fetching Inbox list:", err);
    }
  };
  const deleteNotification = async (id: number) => {
    try {
      const sp = spfi().using(SPFx(SpfxContext));
      await sp.web.lists.getByTitle("Inbox").items.getById(id).delete();

      alert("Notification deleted");
      fetchInboxData(); // refresh the list
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };
  useEffect(() => {
    fetchInboxData();
  }, []);

  const handleView = (notification: Notification) => {
    setSelectedNotification(notification);
    setShow(true);
  };

  return (
    <div className={styles.notificationsContainer}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={filter === "read" ? styles.activeTab : ""}
          onClick={() => setFilter("read")}
        >
          Read
        </button>
        <button
          className={filter === "unread" ? styles.activeTab : ""}
          onClick={() => setFilter("unread")}
        >
          Unread
        </button>
      </div>

      {/* Notification List */}
      {notifications
        .filter((n) => filter === "all" || n.status === filter)
        .map((n) => (
          <div
            key={n.id}
            className={`d-flex justify-content-between align-items-center ${styles.notificationCard}`}
          >
            <div className="d-flex">
              <div className={styles.avatar}>
                {n.from ? n.from[0].toUpperCase() : "?"}
              </div>
              <div>
                <h6 className="mb-1">{n.title}</h6>
                <p className="mb-0">{n.description}</p>
              </div>
            </div>
            <div className="text-end">
              <small className="text-muted">
                {" "}
                {new Date(n.date).toLocaleDateString()}
              </small>
              <div className="mt-2">
                <Badge bg="success p-2" className="me-2">
                  {n.status === "unread" ? "New" : "Read"}
                </Badge>
                <Button
                  variant="outline-warning"
                  size="sm"
                  className="me-2"
                  onClick={() => {
                    setNotiID(n.id);
                    handleView(n);
                  }}
                >
                  👁
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => deleteNotification(n.id)}
                >
                  🗑
                </Button>
              </div>
            </div>
          </div>
        ))}

      {/* Offcanvas */}
      <Offcanvas
        show={show}
        onHide={() => setShow(false)}
        placement="end"
        style={{ width: "800px" }}
        className={styles.detailsOffcanvas}
      >
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="m-0">FY 2023-24</h6>
          <div className="d-flex gap-2">
            <Button variant="warning" size="sm">
              📄 Download PDF
            </Button>
            <Button variant="light" size="sm" onClick={() => setShow(false)}>
              Close
            </Button>
          </div>
        </div>
        <Offcanvas.Body>
          {selectedNotification && (
            <>
              <div className={styles.detailsCard}>
                <div className={styles.header}>
                  <img src={jazzLogo} alt="Jazz Logo" className={styles.logo} />
                  <h6 className="mt-2 fw-bold">{selectedNotification.title}</h6>
                </div>

                <Row className={`mt-4 mb- ${styles.custombg}`}>
                  <Col>
                    <span>From</span>
                    <div>
                      <strong>{selectedNotification.from}</strong>
                    </div>
                  </Col>
                  <Col>
                    <span>Received Date:</span>
                    <div>
                      <strong>
                        {new Date(
                          selectedNotification.date
                        ).toLocaleDateString()}
                      </strong>
                    </div>
                  </Col>
                  <Col>
                    <span>Reference Number:</span>
                    <div>
                      <b>{selectedNotification.id}</b>
                    </div>
                  </Col>
                </Row>

                <pre>{selectedNotification.body}</pre>

                {/* <h6>Attachments:</h6>
                <div className={styles.attachments}>
                  {selectedNotification.attachments.map((file, i) => (
                    <Button
                      key={i}
                      variant="outline-danger"
                      size="sm"
                      className="me-2 mb-2"
                    >
                      📄 {file}
                    </Button>
                  ))}
                </div> */}

                <Button
                  variant="warning"
                  className="mt-3 me-3"
                  disabled={selectedNotification.status === "read"}
                  onClick={async () => {
                    setNotiID(selectedNotification.id);
                    newAdd(); // create case
                    activeForm();
                    setSelectedCase({ Email: selectedNotification.from });
                  }}
                >
                  Create Case
                </Button>
                <Button
                  variant="warning"
                  className="mt-3 "
                  disabled={selectedNotification.status === "read"}
                  onClick={async () => {
                    // Case found → open in update mode
                    setNotiID(selectedNotification.id);
                    setExisting(true); // pass full case object to parent
                    setSelectedCase({ Email: selectedNotification.from });
                    activeForm();
                    newAdd();
                  }}
                >
                  Add In Existing Case
                </Button>
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default Notifications;
