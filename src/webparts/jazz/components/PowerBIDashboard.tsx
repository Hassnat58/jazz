import * as React from "react";
import ManagersTable from "./ManagersTable";

const PowerBIDashboard: React.FC<{ SpfxContext: any }> =  ({SpfxContext}) => {
  return (
    <>
    <div style={{ width: "100%", height: "800px" ,marginBottom:"30px"}}>
      <iframe
        title="Power BI Report"
        width="100%"
        height="100%"
        src="https://app.powerbi.com/view?r=eyJrIjoiOTk0MGUwNDctYzU3Yy00ODI5LWFjZmUtNGNmYWEzYWNhMTBmIiwidCI6IjFhMTdmYjkzLWI5ZTgtNDMzZC05NDE4LTU2NDU1ZWE1NTczYSIsImMiOjN9"
        frameBorder="0"
        allowFullScreen={true}
      />
     
    </div>
     <ManagersTable SpfxContext={SpfxContext} />

    </>
  );
};

export default PowerBIDashboard;
