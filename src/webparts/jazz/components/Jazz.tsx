/* eslint-disable @typescript-eslint/ban-types */
import * as React from "react";
import type { IJazzProps } from "./IJazzProps";
import Dashboard from "./Dashboard";

export default class Jazz extends React.Component<IJazzProps, {}> {
  public render(): React.ReactElement<IJazzProps> {
    return (
      <>
        <Dashboard SpfxContext={this.props.SpfxContext} />
      </>
    );
  }
}
