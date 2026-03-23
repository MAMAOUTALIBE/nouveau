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

// src/app/modules/workflows/workflows.service.ts
var WorkflowsService = class _WorkflowsService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getDefinitions() {
    return this.apiClient.get(API_ENDPOINTS.workflows.definitions).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      code: toStringValue(readField(dto, ["code"], "")),
      name: toStringValue(readField(dto, ["name", "label"], "")),
      steps: toNumberValue(readField(dto, ["steps", "stepsCount", "steps_count"], 0)),
      usedFor: toStringValue(readField(dto, ["usedFor", "used_for"], "")),
      status: toStringValue(readField(dto, ["status"], ""))
    }))));
  }
  getInstances() {
    return this.apiClient.get(API_ENDPOINTS.workflows.instances).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      id: toStringValue(readField(dto, ["id", "instanceId", "instance_id"], "")),
      definition: toStringValue(readField(dto, ["definition", "definitionName", "definition_name"], "")),
      requester: toStringValue(readField(dto, ["requester", "requesterName", "requester_name"], "")),
      createdOn: toStringValue(readField(dto, ["createdOn", "created_on"], "")),
      currentStep: toStringValue(readField(dto, ["currentStep", "current_step"], "")),
      status: toStringValue(readField(dto, ["status"], ""))
    }))));
  }
  static \u0275fac = function WorkflowsService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _WorkflowsService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _WorkflowsService, factory: _WorkflowsService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(WorkflowsService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();

export {
  WorkflowsService
};
//# sourceMappingURL=chunk-GIHGPKVU.js.map
