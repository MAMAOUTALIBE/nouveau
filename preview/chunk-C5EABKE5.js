import "./chunk-KWSTWQNB.js";

// src/app/modules/workflows/workflows.routes.ts
var WORKFLOWS_ROUTES = [
  {
    path: "",
    redirectTo: "definitions",
    pathMatch: "full"
  },
  {
    path: "definitions",
    loadComponent: () => import("./chunk-WASZFFYH.js").then((m) => m.WorkflowDefinitionsPage),
    data: { parentTitle: "Pilotage", childTitle: "Workflows" }
  },
  {
    path: "instances",
    loadComponent: () => import("./chunk-PTSI5YQI.js").then((m) => m.WorkflowInstancesPage),
    data: { parentTitle: "Pilotage", childTitle: "Instances" }
  }
];
export {
  WORKFLOWS_ROUTES
};
//# sourceMappingURL=chunk-C5EABKE5.js.map
