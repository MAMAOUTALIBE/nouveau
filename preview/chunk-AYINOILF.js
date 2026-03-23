import {
  ApiClientService,
  readField,
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

// src/app/modules/personnel/personnel.service.ts
var PersonnelService = class _PersonnelService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getAgents() {
    return this.apiClient.get(API_ENDPOINTS.personnel.agents).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      id: toStringValue(readField(dto, ["id", "matricule", "employeeId", "employee_id"], "")),
      matricule: toStringValue(readField(dto, ["matricule", "employeeId", "employee_id"], "")),
      fullName: toStringValue(readField(dto, ["fullName", "full_name"], "")),
      direction: toStringValue(readField(dto, ["direction", "directionName", "direction_name"], "")),
      position: toStringValue(readField(dto, ["position", "positionTitle", "position_title"], "")),
      status: toStringValue(readField(dto, ["status"], "")),
      manager: toStringValue(readField(dto, ["manager", "managerName", "manager_name"], ""))
    }))));
  }
  getAgentById(id) {
    return this.apiClient.get(API_ENDPOINTS.personnel.agentDetail(id)).pipe(map((dto) => ({
      id: toStringValue(readField(dto, ["id", "matricule", "employeeId", "employee_id"], id)),
      matricule: toStringValue(readField(dto, ["matricule", "employeeId", "employee_id"], "")),
      fullName: toStringValue(readField(dto, ["fullName", "full_name"], "")),
      position: toStringValue(readField(dto, ["position", "positionTitle", "position_title"], "")),
      unit: toStringValue(readField(dto, ["unit", "unitName", "unit_name"], "")),
      email: toStringValue(readField(dto, ["email"], "")),
      phone: toStringValue(readField(dto, ["phone", "mobile"], "")),
      photoUrl: toStringValue(readField(dto, ["photoUrl", "photo_url"], "./assets/images/faces/profile.jpg")),
      careerEvents: mapAgentCareerEvents(readField(dto, ["careerEvents", "career_events"], [])),
      documents: mapAgentDocuments(readField(dto, ["documents"], []))
    })), catchError(() => of(null)));
  }
  static \u0275fac = function PersonnelService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PersonnelService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PersonnelService, factory: _PersonnelService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PersonnelService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();
function mapAgentCareerEvents(events) {
  return (events || []).map((event) => ({
    title: toStringValue(readField(event, ["title", "label"], "")),
    description: toStringValue(readField(event, ["description", "detail"], "")),
    date: toStringValue(readField(event, ["date", "eventDate", "event_date"], ""))
  }));
}
function mapAgentDocuments(documents) {
  return (documents || []).map((doc) => ({
    type: toStringValue(readField(doc, ["type", "category"], "")),
    reference: toStringValue(readField(doc, ["reference", "ref"], "")),
    status: toStringValue(readField(doc, ["status"], ""))
  }));
}

export {
  PersonnelService
};
//# sourceMappingURL=chunk-AYINOILF.js.map
