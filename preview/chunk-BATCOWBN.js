import {
  ApiClientService,
  readField,
  toNumberValue,
  toStringValue
} from "./chunk-2RQ7HY24.js";
import {
  API_ENDPOINTS
} from "./chunk-7C46ZOJO.js";
import {
  Injectable,
  catchError,
  map,
  of,
  setClassMetadata,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-MOIGQQUQ.js";

// src/app/modules/admin/admin.service.ts
var AdminService = class _AdminService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getUsers() {
    return this.apiClient.get(API_ENDPOINTS.admin.users).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      username: toStringValue(readField(dto, ["username", "login"], "")),
      fullName: toStringValue(readField(dto, ["fullName", "full_name"], "")),
      role: toStringValue(readField(dto, ["role", "roleName", "role_name"], "")),
      direction: toStringValue(readField(dto, ["direction", "directionName", "direction_name"], "")),
      status: toStringValue(readField(dto, ["status"], ""))
    }))));
  }
  getRoles() {
    return this.apiClient.get(API_ENDPOINTS.admin.roles).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      name: toStringValue(readField(dto, ["name", "code"], "")),
      description: toStringValue(readField(dto, ["description"], "")),
      permissions: toNumberValue(readField(dto, ["permissions", "permissionsCount", "permissions_count"], 0))
    }))));
  }
  getAudit() {
    return this.apiClient.get(API_ENDPOINTS.admin.audit).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      date: toStringValue(readField(dto, ["date", "timestamp"], "")),
      user: toStringValue(readField(dto, ["user", "username"], "")),
      action: toStringValue(readField(dto, ["action", "event"], "")),
      target: toStringValue(readField(dto, ["target", "resource"], ""))
    }))));
  }
  static \u0275fac = function AdminService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AdminService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AdminService, factory: _AdminService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AdminService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();

export {
  AdminService
};
//# sourceMappingURL=chunk-BATCOWBN.js.map
