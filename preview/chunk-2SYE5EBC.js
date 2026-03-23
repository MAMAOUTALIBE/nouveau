import "./chunk-KWSTWQNB.js";

// src/app/modules/personnel/personnel.routes.ts
var PERSONNEL_ROUTES = [
  {
    path: "agents",
    loadComponent: () => import("./chunk-QUVTLG5Z.js").then((m) => m.AgentListPage),
    data: { parentTitle: "Personnel", childTitle: "Liste des agents" }
  },
  {
    path: "agents/:id",
    loadComponent: () => import("./chunk-5AVJRTGY.js").then((m) => m.AgentDetailPage),
    data: { parentTitle: "Personnel", subParentTitle: "Agents", childTitle: "Fiche agent" }
  },
  {
    path: "dossiers",
    loadComponent: () => import("./chunk-P6LD4TTJ.js").then((m) => m.FeaturePlaceholder),
    data: { parentTitle: "Personnel", childTitle: "Dossiers administratifs" }
  },
  {
    path: "affectations",
    loadComponent: () => import("./chunk-P6LD4TTJ.js").then((m) => m.FeaturePlaceholder),
    data: { parentTitle: "Personnel", childTitle: "Affectations" }
  },
  { path: "", pathMatch: "full", redirectTo: "agents" }
];
export {
  PERSONNEL_ROUTES
};
//# sourceMappingURL=chunk-2SYE5EBC.js.map
