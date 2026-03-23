import "./chunk-KWSTWQNB.js";

// src/app/modules/recruitment/recruitment.routes.ts
var RECRUITMENT_ROUTES = [
  {
    path: "candidatures",
    loadComponent: () => import("./chunk-L7CHFTBD.js").then((m) => m.ApplicationsPage),
    data: { parentTitle: "Recrutement", childTitle: "Candidatures" }
  },
  {
    path: "campagnes",
    loadComponent: () => import("./chunk-4I2WMJPJ.js").then((m) => m.CampaignsPage),
    data: { parentTitle: "Recrutement", childTitle: "Campagnes" }
  },
  {
    path: "integration",
    loadComponent: () => import("./chunk-TOXQ6HGH.js").then((m) => m.OnboardingPage),
    data: { parentTitle: "Recrutement", childTitle: "Int\xE9gration" }
  },
  { path: "", pathMatch: "full", redirectTo: "candidatures" }
];
export {
  RECRUITMENT_ROUTES
};
//# sourceMappingURL=chunk-XZYGWWEJ.js.map
