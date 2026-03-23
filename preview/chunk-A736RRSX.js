import {
  GridJsAngularComponent
} from "./chunk-H6VXTY66.js";
import {
  ApiClientService,
  readField,
  toStringValue
} from "./chunk-2RQ7HY24.js";
import {
  API_ENDPOINTS
} from "./chunk-7C46ZOJO.js";
import "./chunk-BMX4STFJ.js";
import {
  Component,
  Injectable,
  catchError,
  inject,
  map,
  of,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵinject,
  ɵɵproperty,
  ɵɵtext
} from "./chunk-MOIGQQUQ.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-KWSTWQNB.js";

// src/app/modules/documents/documents.service.ts
var DocumentsService = class _DocumentsService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getDocuments() {
    return this.apiClient.get(API_ENDPOINTS.documents.library).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      reference: toStringValue(readField(dto, ["reference", "docRef", "doc_ref"], "")),
      title: toStringValue(readField(dto, ["title", "name"], "")),
      type: toStringValue(readField(dto, ["type", "category"], "")),
      owner: toStringValue(readField(dto, ["owner", "ownerName", "owner_name"], "")),
      updatedAt: toStringValue(readField(dto, ["updatedAt", "updated_at"], "")),
      status: toStringValue(readField(dto, ["status"], ""))
    }))));
  }
  static \u0275fac = function DocumentsService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DocumentsService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DocumentsService, factory: _DocumentsService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DocumentsService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();

// src/app/modules/documents/pages/document-library/document-library.ts
var DocumentLibraryPage = class _DocumentLibraryPage {
  documentsService = inject(DocumentsService);
  gridConfig = {
    columns: ["R\xE9f\xE9rence", "Titre", "Type", "Propri\xE9taire", "Mise \xE0 jour", "Statut"],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: []
  };
  ngOnInit() {
    this.documentsService.getDocuments().subscribe((items) => {
      this.gridConfig = __spreadProps(__spreadValues({}, this.gridConfig), {
        data: items.map((d) => [d.reference, d.title, d.type, d.owner, d.updatedAt, d.status])
      });
    });
  }
  static \u0275fac = function DocumentLibraryPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DocumentLibraryPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DocumentLibraryPage, selectors: [["app-document-library"]], decls: 13, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [3, "config"]], template: function DocumentLibraryPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "Biblioth\xE8que documentaire RH");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "D\xE9poser");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "button", 7);
      \u0275\u0275text(10, "Exporter");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(11, "div", 8);
      \u0275\u0275element(12, "gridjs-angular", 9);
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(12);
      \u0275\u0275property("config", ctx.gridConfig);
    }
  }, dependencies: [GridJsAngularComponent], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DocumentLibraryPage, [{
    type: Component,
    args: [{ selector: "app-document-library", standalone: true, imports: [GridJsAngularComponent], template: '<div class="row row-sm">\n  <div class="col-xl-12">\n    <div class="card custom-card">\n      <div class="card-header justify-content-between">\n        <div class="card-title">Biblioth\xE8que documentaire RH</div>\n        <div class="btn-list">\n          <button class="btn btn-primary">D\xE9poser</button>\n          <button class="btn btn-outline-primary">Exporter</button>\n        </div>\n      </div>\n      <div class="card-body">\n        <gridjs-angular [config]="gridConfig"></gridjs-angular>\n      </div>\n    </div>\n  </div>\n</div>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DocumentLibraryPage, { className: "DocumentLibraryPage", filePath: "src/app/modules/documents/pages/document-library/document-library.ts", lineNumber: 11 });
})();
export {
  DocumentLibraryPage
};
//# sourceMappingURL=chunk-A736RRSX.js.map
