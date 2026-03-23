import "./chunk-KWSTWQNB.js";

// src/app/modules/careers/careers.routes.ts
var CAREERS_ROUTES = [
  {
    path: "avancements",
    loadComponent: () => import("./chunk-R6NWGUHN.js").then((m) => m.AdvancementsPage),
    data: { parentTitle: "Carri\xE8re", childTitle: "Avancements" }
  },
  {
    path: "mutations",
    loadComponent: () => import("./chunk-MTFFMYMN.js").then((m) => m.TransfersPage),
    data: { parentTitle: "Carri\xE8re", childTitle: "Mutations" }
  },
  {
    path: "detachements",
    loadComponent: () => import("./chunk-TQXBVJKW.js").then((m) => m.SecondmentsPage),
    data: { parentTitle: "Carri\xE8re", childTitle: "D\xE9tachements" }
  },
  {
    path: "promotions",
    loadComponent: () => import("./chunk-7BEXBS2U.js").then((m) => m.PromotionsPage),
    data: { parentTitle: "Carri\xE8re", childTitle: "Promotions" }
  },
  { path: "", pathMatch: "full", redirectTo: "avancements" }
];
export {
  CAREERS_ROUTES
};
//# sourceMappingURL=chunk-7T7BR67A.js.map
