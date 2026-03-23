import "./chunk-KWSTWQNB.js";

// src/app/modules/organization/organization.routes.ts
var ORGANIZATION_ROUTES = [
  {
    path: "organigramme",
    loadComponent: () => import("./chunk-2DHZMQI3.js").then((m) => m.OrgChartPage),
    data: { parentTitle: "Organisation", childTitle: "Organigramme" }
  },
  {
    path: "postes-budgetaires",
    loadComponent: () => import("./chunk-HY55VKHO.js").then((m) => m.BudgetedPositionsPage),
    data: { parentTitle: "Organisation", childTitle: "Postes budg\xE9taires" }
  },
  {
    path: "postes-vacants",
    loadComponent: () => import("./chunk-MSTZHVBT.js").then((m) => m.VacantPositionsPage),
    data: { parentTitle: "Organisation", childTitle: "Postes vacants" }
  },
  { path: "", pathMatch: "full", redirectTo: "organigramme" }
];
export {
  ORGANIZATION_ROUTES
};
//# sourceMappingURL=chunk-YFC44435.js.map
