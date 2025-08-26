import * as React from "react";

const PowerBIDashboard: React.FC = () => {
  return (
    <div style={{ width: "100%", height: "800px" }}>
      <iframe
        title="Power BI Report"
        width="100%"
        height="100%"
        src="https://app.powerbi.com/reportEmbed?reportId=d94a8559-b65e-4293-87f8-77d642774f92
        &autoAuth=true"
        frameBorder="0"
        allowFullScreen={true}
      />
    </div>
  );
};

export default PowerBIDashboard;
