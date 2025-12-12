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
  const [hasRole, setHasRole] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const sp = spfi().using(SPFx(SpfxContext));
        const currentUser = await sp.web.currentUser();

        const roles = await sp.web.lists
          .getByTitle("Role")
          .items.filter(`Person/Id eq ${currentUser.Id}`)
          .select("Role", "Person/Id")
          .expand("Person")();

        const anyRole = roles.length > 0;
        setHasRole(anyRole);

        setIsAdmin(roles.some((r: any) => r.Role === "Admin"));
        setIsManager(roles.some((r: any) => r.Role === "Manager"));
      } catch (err) {
        console.error("Error loading user info:", err);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, [SpfxContext]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>
    );
  }

  if (!hasRole) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "black",
          fontWeight: "600",
          fontSize: "18px",
        }}
      >
        You do not have access.
      </div>
    );
  }

  return (
    <>
      {/* Power BI Dashboard */}
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

      {/* Managers Table only for Admin / Manager */}
      {(isAdmin || isManager) && <ManagersTable SpfxContext={SpfxContext} />}
    </>
  );
};

export default PowerBIDashboard;
