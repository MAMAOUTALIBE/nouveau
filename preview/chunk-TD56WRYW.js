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

// src/app/modules/training/training.service.ts
var TrainingService = class _TrainingService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getSessions() {
    return this.apiClient.get(API_ENDPOINTS.training.sessions).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      code: toStringValue(readField(dto, ["code"], "")),
      title: toStringValue(readField(dto, ["title", "name"], "")),
      dates: toStringValue(readField(dto, ["dates", "sessionDates", "session_dates"], "")),
      location: toStringValue(readField(dto, ["location", "venue"], "")),
      seats: toNumberValue(readField(dto, ["seats", "seatsCount", "seats_count"], 0)),
      enrolled: toNumberValue(readField(dto, ["enrolled", "enrolledCount", "enrolled_count"], 0)),
      status: toStringValue(readField(dto, ["status"], ""))
    }))));
  }
  getCatalog() {
    return this.apiClient.get(API_ENDPOINTS.training.catalog).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      code: toStringValue(readField(dto, ["code"], "")),
      title: toStringValue(readField(dto, ["title", "name"], "")),
      duration: toStringValue(readField(dto, ["duration"], "")),
      modality: toStringValue(readField(dto, ["modality", "mode"], "")),
      domain: toStringValue(readField(dto, ["domain", "category"], ""))
    }))));
  }
  static \u0275fac = function TrainingService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _TrainingService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TrainingService, factory: _TrainingService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TrainingService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();

export {
  TrainingService
};
//# sourceMappingURL=chunk-TD56WRYW.js.map
