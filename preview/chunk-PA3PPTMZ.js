import "./chunk-KWSTWQNB.js";

// src/app/modules/documents/documents.routes.ts
var DOCUMENTS_ROUTES = [
  {
    path: "",
    redirectTo: "bibliotheque",
    pathMatch: "full"
  },
  {
    path: "bibliotheque",
    loadComponent: () => import("./chunk-A736RRSX.js").then((m) => m.DocumentLibraryPage),
    data: { parentTitle: "Pilotage", childTitle: "Documents" }
  }
];
export {
  DOCUMENTS_ROUTES
};
//# sourceMappingURL=chunk-PA3PPTMZ.js.map
