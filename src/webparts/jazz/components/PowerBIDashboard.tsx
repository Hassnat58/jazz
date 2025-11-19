/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */

import * as React from "react";
import ManagersTable from "./ManagersTable";
import { spfi, SPFx } from "@pnp/sp";

const PowerBIDashboard: React.FC<{ SpfxContext: any; attachments: any }> = ({
  SpfxContext,
  attachments,
}) => {
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
          src="https://app.powerbi.com/reportEmbed?reportId=e731074b-9bdc-41dc-acea-945d2c27adc0&autoAuth=true&ctid=5764b349-a60c-4df1-8cf5-62d06dd5b2c3"
          frameBorder="0"
          allowFullScreen={true}
        />
      </div>
      {(isAdmin || isManager) && <ManagersTable SpfxContext={SpfxContext} />}
    </>
  );
};

export default PowerBIDashboard;
