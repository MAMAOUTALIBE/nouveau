import {
  HttpClient,
  HttpParams,
  environment
} from "./chunk-7C46ZOJO.js";
import {
  Injectable,
  inject,
  map,
  setClassMetadata,
  ɵɵdefineInjectable
} from "./chunk-MOIGQQUQ.js";

// src/app/core/utils/dto.utils.ts
function readField(source, keys, fallback) {
  if (!source)
    return fallback;
  for (const key of keys) {
    const value = source[key];
    if (value !== void 0 && value !== null) {
      return value;
    }
  }
  return fallback;
}
function toStringValue(value, fallback = "") {
  if (value === void 0 || value === null)
    return fallback;
  return String(value);
}
function toNumberValue(value, fallback = 0) {
  if (typeof value === "number" && !Number.isNaN(value))
    return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed))
      return parsed;
  }
  return fallback;
}

// src/app/core/services/api-client.service.ts
var ApiClientService = class _ApiClientService {
  http = inject(HttpClient);
  get(path, params) {
    return this.http.get(this.buildUrl(path), {
      params: this.toHttpParams(params)
    }).pipe(map((response) => this.unwrap(response)));
  }
  post(path, body) {
    return this.http.post(this.buildUrl(path), body).pipe(map((response) => this.unwrap(response)));
  }
  unwrap(response) {
    if (response && typeof response === "object" && "data" in response) {
      return response.data;
    }
    return response;
  }
  buildUrl(path) {
    const base = environment.api.baseUrl.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }
  toHttpParams(params) {
    if (!params)
      return void 0;
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }
  static \u0275fac = function ApiClientService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ApiClientService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ApiClientService, factory: _ApiClientService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ApiClientService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();

export {
  readField,
  toStringValue,
  toNumberValue,
  ApiClientService
};
//# sourceMappingURL=chunk-2RQ7HY24.js.map
