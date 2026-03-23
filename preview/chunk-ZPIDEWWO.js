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

// src/app/modules/careers/careers.service.ts
var CareersService = class _CareersService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getMovesByType(type) {
    return this.apiClient.get(API_ENDPOINTS.careers.moves, { type }).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      reference: toStringValue(readField(dto, ["reference", "requestRef", "request_ref"], "")),
      agent: toStringValue(readField(dto, ["agent", "agentName", "agent_name"], "")),
      type: readField(dto, ["type", "movementType", "movement_type"], type),
      from: readField(dto, ["from", "fromLabel", "from_label"], void 0),
      to: toStringValue(readField(dto, ["to", "toLabel", "to_label"], "")),
      effectiveDate: toStringValue(readField(dto, ["effectiveDate", "effective_date"], "")),
      status: toStringValue(readField(dto, ["status"], ""))
    }))));
  }
  static \u0275fac = function CareersService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CareersService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CareersService, factory: _CareersService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CareersService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();

export {
  CareersService
};
//# sourceMappingURL=chunk-ZPIDEWWO.js.map
