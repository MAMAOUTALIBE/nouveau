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

// src/app/modules/leave/leave.service.ts
var LeaveService = class _LeaveService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getRequests() {
    return this.apiClient.get(API_ENDPOINTS.leave.requests).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      reference: toStringValue(readField(dto, ["reference", "requestRef", "request_ref"], "")),
      agent: toStringValue(readField(dto, ["agent", "agentName", "agent_name"], "")),
      type: toStringValue(readField(dto, ["type", "leaveType", "leave_type"], "")),
      startDate: toStringValue(readField(dto, ["startDate", "start_date"], "")),
      endDate: toStringValue(readField(dto, ["endDate", "end_date"], "")),
      status: toStringValue(readField(dto, ["status"], ""))
    }))));
  }
  getBalances() {
    return this.apiClient.get(API_ENDPOINTS.leave.balances).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      type: toStringValue(readField(dto, ["type", "leaveType", "leave_type"], "")),
      allocated: toNumberValue(readField(dto, ["allocated", "allocatedDays", "allocated_days"], 0)),
      consumed: toNumberValue(readField(dto, ["consumed", "consumedDays", "consumed_days"], 0)),
      remaining: toNumberValue(readField(dto, ["remaining", "remainingDays", "remaining_days"], 0))
    }))));
  }
  getEvents() {
    return this.apiClient.get(API_ENDPOINTS.leave.events).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      title: toStringValue(readField(dto, ["title", "label"], "")),
      start: toStringValue(readField(dto, ["start", "startDate", "start_date"], "")),
      end: readField(dto, ["end", "endDate", "end_date"], void 0),
      className: readField(dto, ["className", "class_name", "colorClass"], void 0)
    }))));
  }
  static \u0275fac = function LeaveService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LeaveService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _LeaveService, factory: _LeaveService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LeaveService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();

export {
  LeaveService
};
//# sourceMappingURL=chunk-6OCEZ4JL.js.map
