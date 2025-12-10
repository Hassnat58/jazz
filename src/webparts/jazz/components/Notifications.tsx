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
import { Offcanvas, Button, Row, Col } from "react-bootstrap";
import styles from "./Notifications.module.scss";
import pdfIcon from "../assets/pdf.png";
import wordIcon from "../assets/word.png";
import xlsIcon from "../assets/xls.png";
import imageIcon from "../assets/image.png";
import genericIcon from "../assets/document.png"; // fallback

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
  activeFormOut: any;
}

const Notifications: React.FC<NotificationsProps> = ({
  newAdd,
  activeForm,
  SpfxContext,
  setNotiID,
  activeFormOut,
  setSelectedCase,
  setExisting,
}) => {
  const [show, setShow] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("unread");
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
        attachments:
          item.AttachmentFiles.length > 0
            ? item.AttachmentFiles.map((f: any) => {
                return {
                  id: f.FileName,
                  Name: f.FileName,
                  ServerRelativeUrl: f.ServerRelativeUrl,
                  absoluteUrl: `${window.location.origin}${f.ServerRelativeUrl}`,
                };
              })
            : [],
        status: item.Status?.toLowerCase() === "read" ? "read" : "unread",
      }));
      // console.log(items);

      setNotifications(mapped);
    } catch (err) {
      console.error("Error fetching Inbox list:", err);
    }
  };

  // const deleteNotification = async (id: number) => {
  //   try {
  //     const sp = spfi().using(SPFx(SpfxContext));
  //     await sp.web.lists.getByTitle("Inbox").items.getById(id).delete();

  //     alert("Notification deleted");
  //     fetchInboxData(); // refresh the list
  //   } catch (err) {
  //     console.error("Error deleting notification:", err);
  //   }
  // };
  useEffect(() => {
    fetchInboxData();
  }, []);
  const handleDownload = async (
    serverRelativeUrl: string,
    fileName: string
  ) => {
    try {
      const sp = spfi().using(SPFx(SpfxContext));

      // get file as blob from SharePoint directly
      const file = sp.web.getFileByServerRelativePath(serverRelativeUrl);
      const blob = await file.getBlob();

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleView = (notification: Notification) => {
    setSelectedNotification(notification);
    setShow(true);
  };
const filteredNotifications = notifications.filter(
  (n) => filter === "all" || n.status === filter
);

  return (
    <div className={styles.notificationsContainer}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={filter === "unread" ? styles.activeTab : ""}
          onClick={() => setFilter("unread")}
        >
          Unread
        </button>
        <button
          className={filter === "read" ? styles.activeTab : ""}
          onClick={() => setFilter("read")}
        >
          Submited
        </button>
      </div>
<div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              
                <th >From</th>
                <th >Subject</th>

                <th >Date</th>
                <th >Action</th>

             
            </tr>
          </thead>
        <tbody>
  {filteredNotifications.length === 0 ? (
    <tr>
      <td colSpan={4} style={{ textAlign: "center" }}>
        No Data Available
      </td>
    </tr>
  ) : (
    filteredNotifications.map((n, idx) => (
      <tr key={idx}>
        <td >{n.from }</td>
        <td>{n.title}</td>
        <td>{new Date(n.date).toLocaleDateString()}</td>
        <td>
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
        </td>
      </tr>
    ))
  )}
</tbody>

        </table>
{/* 
        {selectedCase && (
          <CorrespondenceDetailOffCanvas
            show={show}
            handleClose={() => setShow(false)}
            caseData={selectedCase}
          />
        )} */}
      </div>




      {/* Notification List */}
      {/* {notifications
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
                <h6 >{n.title}</h6>
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
        ))} */}

      {/* Offcanvas */}
      <Offcanvas
        show={show}
        onHide={() => setShow(false)}
        placement="end"
        style={{ width: "800px" }}
        className={styles.detailsOffcanvas}
      >
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <div className="d-flex gap-2">
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

                <h6>Attachments:</h6>
                <div className={styles.attachments}>
                  {selectedNotification.attachments &&
                  selectedNotification.attachments.length > 0 ? (
                    selectedNotification?.attachments.map((file: any) => {
                      const fileName = file?.Name || "";
                      // const fileUrl = `${window.location.origin}${file.ServerRelativeUrl}`;
                      // const fileSizeBytes = file?.Length || 0;
                      // const fileSize =
                      //   fileSizeBytes > 1024 * 1024
                      //     ? (fileSizeBytes / (1024 * 1024)).toFixed(2) + " MB"
                      //     : (fileSizeBytes / 1024).toFixed(2) + " KB";

                      const extension = fileName
                        .split(".")
                        .pop()
                        ?.toLowerCase();
                      let iconPath = genericIcon;
                      switch (extension) {
                        case "pdf":
                          iconPath = pdfIcon;
                          break;
                        case "doc":
                        case "docx":
                          iconPath = wordIcon;
                          break;
                        case "xls":
                        case "xlsx":
                          iconPath = xlsIcon;
                          break;
                        case "png":
                        case "jpg":
                        case "jpeg":
                          iconPath = imageIcon;
                          break;
                        default:
                          iconPath = genericIcon;
                      }

                      return (
                        <div className={styles.fileItem} key={file.ID}>
                          <img
                            src={iconPath}
                            alt={extension + " file"}
                            style={{
                              width: "24px",
                              height: "24px",
                              objectFit: "contain",
                            }}
                          />
                          <span>{fileName}</span>
                          {/* <span>{fileSize}</span> */}
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() =>
                              handleDownload(file.ServerRelativeUrl, fileName)
                            }
                          >
                            ⬇
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p>No attachments found.</p>
                  )}{" "}
                </div>

                <Button
                  variant="warning"
                  className="mt-3 me-3"
                  disabled={selectedNotification.status === "read"}
                  onClick={async () => {
                    setNotiID(selectedNotification.id);
                    newAdd(); // create case
                    activeForm();
                    setSelectedCase({ Email: selectedNotification.title });
                  }}
                >
                  New Litigation
                </Button>
                <Button
                  variant="warning"
                  className="mt-3 "
                  disabled={selectedNotification.status === "read"}
                  onClick={async () => {
                    // Case found → open in update mode
                    setNotiID(selectedNotification.id);
                    setExisting(true); // pass full case object to parent
                    setSelectedCase({ Email: selectedNotification.title });
                    activeForm();
                    newAdd();
                  }}
                >
                  Add to Existing Litigation
                </Button>
                <br />
                <Button
                  variant="warning"
                  className="mt-3 me-3"
                  disabled={selectedNotification.status === "read"}
                  onClick={async () => {
                    setNotiID(selectedNotification.id);
                    newAdd(); // create case
                    activeFormOut();
                    setSelectedCase({ Email: selectedNotification.title });
                  }}
                >
                  New Response
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
