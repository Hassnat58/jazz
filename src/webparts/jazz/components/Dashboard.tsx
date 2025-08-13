/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import Navbar from "./Navbar";
import TabbedTables from "./TabedTable";
import { useState } from "react";

function Dashboard(props: any) {
  const [showLOVManagement, setShowLOVManagement] = useState(false);
  return (
    <div>
      <Navbar onLOVManagementClick={() => setShowLOVManagement(true)} />
      <TabbedTables
        SpfxContext={props.SpfxContext}
        showLOVManagement={showLOVManagement}
        setShowLOVManagement={setShowLOVManagement}
      />
    </div>
  );
}

export default Dashboard;
