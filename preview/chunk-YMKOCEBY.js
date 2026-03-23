import "./chunk-KWSTWQNB.js";

// src/app/modules/training/training.routes.ts
var TRAINING_ROUTES = [
  {
    path: "",
    redirectTo: "sessions",
    pathMatch: "full"
  },
  {
    path: "sessions",
    loadComponent: () => import("./chunk-YQ2WCI4B.js").then((m) => m.TrainingSessionsPage),
    data: { parentTitle: "Pilotage", childTitle: "Formation" }
  },
  {
    path: "catalogue",
    loadComponent: () => import("./chunk-JDVOWPKA.js").then((m) => m.TrainingCatalogPage),
    data: { parentTitle: "Pilotage", childTitle: "Catalogue" }
  }
];
export {
  TRAINING_ROUTES
};
//# sourceMappingURL=chunk-YMKOCEBY.js.map
