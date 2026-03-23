import "./chunk-KWSTWQNB.js";

// src/app/modules/performance/performance.routes.ts
var PERFORMANCE_ROUTES = [
  {
    path: "",
    redirectTo: "campagnes",
    pathMatch: "full"
  },
  {
    path: "campagnes",
    loadComponent: () => import("./chunk-CX4R6DX5.js").then((m) => m.PerfCampaignsPage),
    data: { parentTitle: "Pilotage", childTitle: "\xC9valuation" }
  },
  {
    path: "resultats",
    loadComponent: () => import("./chunk-YSDN6LBB.js").then((m) => m.PerfResultsPage),
    data: { parentTitle: "Pilotage", childTitle: "R\xE9sultats" }
  }
];
export {
  PERFORMANCE_ROUTES
};
//# sourceMappingURL=chunk-WTVIIBY3.js.map
