import "./chunk-KWSTWQNB.js";

// src/app/modules/discipline/discipline.routes.ts
var DISCIPLINE_ROUTES = [
  {
    path: "",
    redirectTo: "dossiers",
    pathMatch: "full"
  },
  {
    path: "dossiers",
    loadComponent: () => import("./chunk-OHEAIOJS.js").then((m) => m.DisciplineCasesPage),
    data: { parentTitle: "Pilotage", childTitle: "Discipline" }
  }
];
export {
  DISCIPLINE_ROUTES
};
//# sourceMappingURL=chunk-TP23XMQK.js.map
