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

// src/app/modules/performance/performance.service.ts
var PerformanceService = class _PerformanceService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getCampaigns() {
    return this.apiClient.get(API_ENDPOINTS.performance.campaigns).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      code: toStringValue(readField(dto, ["code"], "")),
      title: toStringValue(readField(dto, ["title", "name"], "")),
      period: toStringValue(readField(dto, ["period"], "")),
      population: toStringValue(readField(dto, ["population", "targetPopulation", "target_population"], "")),
      status: toStringValue(readField(dto, ["status"], ""))
    }))));
  }
  getResults() {
    return this.apiClient.get(API_ENDPOINTS.performance.results).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      agent: toStringValue(readField(dto, ["agent", "agentName", "agent_name"], "")),
      direction: toStringValue(readField(dto, ["direction", "directionName", "direction_name"], "")),
      managerScore: toNumberValue(readField(dto, ["managerScore", "manager_score"], 0)),
      selfScore: toNumberValue(readField(dto, ["selfScore", "self_score"], 0)),
      finalScore: toNumberValue(readField(dto, ["finalScore", "final_score"], 0)),
      status: toStringValue(readField(dto, ["status"], ""))
    }))));
  }
  static \u0275fac = function PerformanceService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PerformanceService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PerformanceService, factory: _PerformanceService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PerformanceService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();

export {
  PerformanceService
};
//# sourceMappingURL=chunk-6UQPU5YR.js.map
