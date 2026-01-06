/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
"use strict";

const build = require("@microsoft/sp-build-web");

// Suppress specific Sass warnings
build.addSuppression(
  /Warning - \[sass\] The local CSS class '.*' is not camelCase and will not be type-safe\./
);

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set("serve", result.get("serve-deprecated"));

  return result;
};

build.initialize(require("gulp"));
