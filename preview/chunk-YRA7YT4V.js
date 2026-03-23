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

// src/app/modules/recruitment/recruitment.service.ts
var RecruitmentService = class _RecruitmentService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getApplications() {
    return this.apiClient.get(API_ENDPOINTS.recruitment.applications).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      reference: toStringValue(readField(dto, ["reference", "requestRef", "request_ref"], "")),
      candidate: toStringValue(readField(dto, ["candidate", "candidateName", "candidate_name"], "")),
      position: toStringValue(readField(dto, ["position", "positionTitle", "position_title"], "")),
      campaign: toStringValue(readField(dto, ["campaign", "campaignTitle", "campaign_title"], "")),
      status: toStringValue(readField(dto, ["status"], "")),
      receivedOn: toStringValue(readField(dto, ["receivedOn", "received_on"], ""))
    }))));
  }
  getCampaigns() {
    return this.apiClient.get(API_ENDPOINTS.recruitment.campaigns).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      code: toStringValue(readField(dto, ["code"], "")),
      title: toStringValue(readField(dto, ["title", "name"], "")),
      department: toStringValue(readField(dto, ["department", "departmentName", "department_name"], "")),
      openings: toNumberValue(readField(dto, ["openings", "openPositions", "open_positions"], 0)),
      startDate: toStringValue(readField(dto, ["startDate", "start_date"], "")),
      endDate: toStringValue(readField(dto, ["endDate", "end_date"], "")),
      status: toStringValue(readField(dto, ["status"], ""))
    }))));
  }
  getOnboarding() {
    return this.apiClient.get(API_ENDPOINTS.recruitment.onboarding).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      agent: toStringValue(readField(dto, ["agent", "agentName", "agent_name"], "")),
      position: toStringValue(readField(dto, ["position", "positionTitle", "position_title"], "")),
      startDate: toStringValue(readField(dto, ["startDate", "start_date"], "")),
      checklist: readField(dto, ["checklist", "tasks"], []) || [],
      status: toStringValue(readField(dto, ["status"], ""))
    }))));
  }
  static \u0275fac = function RecruitmentService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RecruitmentService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RecruitmentService, factory: _RecruitmentService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RecruitmentService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();

export {
  RecruitmentService
};
//# sourceMappingURL=chunk-YRA7YT4V.js.map
