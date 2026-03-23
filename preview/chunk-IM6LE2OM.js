import "./chunk-KWSTWQNB.js";

// src/app/modules/leave/leave.routes.ts
var LEAVE_ROUTES = [
  {
    path: "demandes",
    loadComponent: () => import("./chunk-M6A44RX3.js").then((m) => m.LeaveRequestsPage),
    data: { parentTitle: "Absences", childTitle: "Demandes" }
  },
  {
    path: "calendrier",
    loadComponent: () => import("./chunk-3AJP6XWZ.js").then((m) => m.LeaveCalendarPage),
    data: { parentTitle: "Absences", childTitle: "Calendrier" }
  },
  {
    path: "soldes",
    loadComponent: () => import("./chunk-ODSR6AGT.js").then((m) => m.LeaveBalancesPage),
    data: { parentTitle: "Absences", childTitle: "Soldes" }
  },
  { path: "", pathMatch: "full", redirectTo: "demandes" }
];
export {
  LEAVE_ROUTES
};
//# sourceMappingURL=chunk-IM6LE2OM.js.map
