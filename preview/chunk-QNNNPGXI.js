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

// src/app/modules/organization/organization.service.ts
var OrganizationService = class _OrganizationService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getOrgUnits() {
    return this.apiClient.get(API_ENDPOINTS.organization.units).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      id: toStringValue(readField(dto, ["id", "code"], "")),
      name: toStringValue(readField(dto, ["name", "label"], "")),
      parentId: readField(dto, ["parentId", "parent_id"], void 0),
      head: readField(dto, ["head", "manager"], void 0),
      headTitle: readField(dto, ["headTitle", "head_title", "managerTitle", "manager_title"], void 0),
      staffCount: toNumberValue(readField(dto, ["staffCount", "staff_count", "agentsCount", "agents_count"], 0))
    }))));
  }
  getBudgetedPositions() {
    return this.apiClient.get(API_ENDPOINTS.organization.budgetedPositions).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      code: toStringValue(readField(dto, ["code"], "")),
      structure: toStringValue(readField(dto, ["structure", "structureName", "structure_name"], "")),
      title: toStringValue(readField(dto, ["title", "label"], "")),
      grade: toStringValue(readField(dto, ["grade"], "")),
      status: readField(dto, ["status"], "Ouvert"),
      holder: readField(dto, ["holder", "holderName", "holder_name"], void 0)
    }))));
  }
  getVacantPositions() {
    return this.apiClient.get(API_ENDPOINTS.organization.vacantPositions).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      code: toStringValue(readField(dto, ["code"], "")),
      structure: toStringValue(readField(dto, ["structure", "structureName", "structure_name"], "")),
      title: toStringValue(readField(dto, ["title", "label"], "")),
      grade: toStringValue(readField(dto, ["grade"], "")),
      openedOn: toStringValue(readField(dto, ["openedOn", "opened_on", "openDate", "open_date"], "")),
      priority: readField(dto, ["priority"], "Normale")
    }))));
  }
  static \u0275fac = function OrganizationService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _OrganizationService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _OrganizationService, factory: _OrganizationService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OrganizationService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();

export {
  OrganizationService
};
//# sourceMappingURL=chunk-QNNNPGXI.js.map
