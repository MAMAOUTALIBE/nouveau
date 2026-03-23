import "./chunk-KWSTWQNB.js";

// src/app/modules/reports/reports.routes.ts
var REPORTS_ROUTES = [
  {
    path: "",
    redirectTo: "rh",
    pathMatch: "full"
  },
  {
    path: "rh",
    loadComponent: () => import("./chunk-HKVQ6EJE.js").then((m) => m.HrReportsPage),
    data: { parentTitle: "Pilotage", childTitle: "Rapports" }
  }
];
export {
  REPORTS_ROUTES
};
//# sourceMappingURL=chunk-RK2CK7MC.js.map
