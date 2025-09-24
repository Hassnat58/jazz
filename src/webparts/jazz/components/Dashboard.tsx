/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import Navbar from "./Navbar";
import TabbedTables from "./TabedTable";
import { useState } from "react";

function Dashboard(props: any) {
  const [showLOVManagement, setShowLOVManagement] = useState(false);
  const [showManageRole, setShowManageRole] = useState(false);
  const [showConsultantManagement, setShowConsultantManagement] =
    useState(false);
  const [showLawyerManagement, setShowLawyerManagement] = useState(false);

  const openManagementScreen = (
    screen: "LOV" | "Role" | "Consultant" | "Lawyer" | null
  ) => {
    setShowLOVManagement(screen === "LOV");
    setShowManageRole(screen === "Role");
    setShowConsultantManagement(screen === "Consultant");
    setShowLawyerManagement(screen === "Lawyer");
  };

  return (
    <div>
      <Navbar
        onLOVManagementClick={() => openManagementScreen("LOV")}
        onManageRoleClick={() => openManagementScreen("Role")}
        onConsultantManagementClick={() => openManagementScreen("Consultant")}
        onLawyerManagementClick={() => openManagementScreen("Lawyer")}
        SpfxContext={props.SpfxContext}
      />

      <TabbedTables
        SpfxContext={props.SpfxContext}
        showConsultantManagement={showConsultantManagement}
        setShowConsultantManagement={setShowConsultantManagement}
        showLOVManagement={showLOVManagement}
        setShowLOVManagement={setShowLOVManagement}
        showManageRole={showManageRole}
        setShowManageRole={setShowManageRole}
        showLawyerManagement={showLawyerManagement}
        setShowLawyerManagement={setShowLawyerManagement}
      />
    </div>
  );
}

export default Dashboard;
