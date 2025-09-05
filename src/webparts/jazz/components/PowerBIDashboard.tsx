/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */

import * as React from "react";
import ManagersTable from "./ManagersTable";
import { spfi, SPFx } from "@pnp/sp";

const PowerBIDashboard: React.FC<{ SpfxContext: any }> = ({ SpfxContext }) => {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isManager, setIsManager] = React.useState(false);

  React.useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const sp = spfi().using(SPFx(SpfxContext));

        // Get current user
        const currentUser = await sp.web.currentUser();

        // Get user role
        const roles = await sp.web.lists
          .getByTitle("Role")
          .items.filter(`Person/Id eq ${currentUser.Id}`)
          .select("Role", "Person/Id")
          .expand("Person")();

        const hasAdminRole = roles.some((r: any) => r.Role === "Admin");
        setIsAdmin(hasAdminRole);

        const hasManagerRole = roles.some((r: any) => r.Role === "Manager");
        setIsManager(hasManagerRole);
      } catch (err) {
        console.error("Error loading user info:", err);
      }
    };

    loadUserInfo();
  }, [SpfxContext]);

  return (
    <>
      <div style={{ width: "100%", height: "800px", marginBottom: "30px" }}>
        <iframe
          title="Power BI Report"
          width="100%"
          height="100%"
          src="https://app.powerbi.com/view?r=eyJrIjoiOTk0MGUwNDctYzU3Yy00ODI5LWFjZmUtNGNmYWEzYWNhMTBmIiwidCI6IjFhMTdmYjkzLWI5ZTgtNDMzZC05NDE4LTU2NDU1ZWE1NTczYSIsImMiOjN9"
          frameBorder="0"
          allowFullScreen={true}
        />
      </div>
      {(isAdmin || isManager) && <ManagersTable SpfxContext={SpfxContext} />}
    </>
  );
};

export default PowerBIDashboard;
