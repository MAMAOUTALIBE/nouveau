import "./chunk-KWSTWQNB.js";

// src/app/modules/admin/admin.routes.ts
var ADMIN_ROUTES = [
  {
    path: "",
    redirectTo: "utilisateurs",
    pathMatch: "full"
  },
  {
    path: "utilisateurs",
    loadComponent: () => import("./chunk-2GJNLKSU.js").then((m) => m.AdminUsersPage),
    data: { parentTitle: "Administration", childTitle: "Utilisateurs" }
  },
  {
    path: "roles",
    loadComponent: () => import("./chunk-Q5E2MRBX.js").then((m) => m.AdminRolesPage),
    data: { parentTitle: "Administration", childTitle: "R\xF4les" }
  },
  {
    path: "audit",
    loadComponent: () => import("./chunk-DVSDIZ44.js").then((m) => m.AdminAuditPage),
    data: { parentTitle: "Administration", childTitle: "Audit" }
  }
];
export {
  ADMIN_ROUTES
};
//# sourceMappingURL=chunk-MA3MIOGV.js.map
