/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import Navbar from "./Navbar";
import TabbedTables from "./TabedTable";

function Dashboard(props: any) {
  return (
    <div>
      <Navbar />
      <TabbedTables SpfxContext={props.SpfxContext} />
    </div>
  );
}

export default Dashboard;
