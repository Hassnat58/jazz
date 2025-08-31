/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import Navbar from "./Navbar";
import TabbedTables from "./TabedTable";
import { useState } from "react";

function Dashboard(props: any) {
  const [showLOVManagement, setShowLOVManagement] = useState(false);
  const [showManageRole, setShowManageRole] = useState(false);
  return (
    <div>
      <Navbar
        onLOVManagementClick={() => setShowLOVManagement(true)}
        onManageRoleClick={() => setShowManageRole(true)}
        SpfxContext={props.SpfxContext}
      />
      <TabbedTables
        SpfxContext={props.SpfxContext}
        showLOVManagement={showLOVManagement}
        setShowLOVManagement={setShowLOVManagement}
        showManageRole={showManageRole}
        setShowManageRole={setShowManageRole}
      />
    </div>
  );
}

export default Dashboard;
