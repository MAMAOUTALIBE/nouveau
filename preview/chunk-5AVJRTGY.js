import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLink,
  NgbNavLinkBase,
  NgbNavModule,
  NgbNavOutlet
} from "./chunk-O2O2T4YI.js";
import {
  SpkReusableTables
} from "./chunk-7UH7FJCU.js";
import {
  PersonnelService
} from "./chunk-AYINOILF.js";
import {
  ActivatedRoute
} from "./chunk-4BN2KUUY.js";
import "./chunk-2RQ7HY24.js";
import "./chunk-U53XDZ2X.js";
import "./chunk-7C46ZOJO.js";
import "./chunk-BMX4STFJ.js";
import {
  Component,
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction3,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-MOIGQQUQ.js";
import "./chunk-KWSTWQNB.js";

// src/app/modules/personnel/pages/agent-detail/agent-detail.ts
var _c0 = () => ({ header: "Type" });
var _c1 = () => ({ header: "R\xE9f\xE9rence" });
var _c2 = () => ({ header: "Statut" });
var _c3 = (a0, a1, a2) => [a0, a1, a2];
var _forTrack0 = ($index, $item) => $item.date;
var _forTrack1 = ($index, $item) => $item.reference;
function AgentDetailPage_ng_template_28_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 23)(1, "div", 24)(2, "div", 25)(3, "strong");
    \u0275\u0275text(4, "Matricule");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 25)(8, "strong");
    \u0275\u0275text(9, "Fonction");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "div");
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "div", 25)(13, "strong");
    \u0275\u0275text(14, "Structure");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "div");
    \u0275\u0275text(16);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(ctx_r0.agent.matricule);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r0.agent.position);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r0.agent.unit);
  }
}
function AgentDetailPage_ng_template_32_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 26)(1, "div", 27);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 28);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "small", 28);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const event_r2 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(event_r2.title);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(event_r2.description);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(event_r2.date);
  }
}
function AgentDetailPage_ng_template_32_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 23);
    \u0275\u0275repeaterCreate(1, AgentDetailPage_ng_template_32_For_2_Template, 7, 3, "div", 26, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r0.careerEvents);
  }
}
function AgentDetailPage_ng_template_36_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td")(6, "span", 31);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const doc_r3 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(doc_r3.type);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(doc_r3.reference);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(doc_r3.status);
  }
}
function AgentDetailPage_ng_template_36_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 29)(1, "spk-reusable-tables", 30);
    \u0275\u0275repeaterCreate(2, AgentDetailPage_ng_template_36_For_3_Template, 8, 3, "tr", null, _forTrack1);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("tableClass", "table text-nowrap")("columns", \u0275\u0275pureFunction3(6, _c3, \u0275\u0275pureFunction0(3, _c0), \u0275\u0275pureFunction0(4, _c1), \u0275\u0275pureFunction0(5, _c2)))("data", ctx_r0.documents);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r0.documents);
  }
}
var AgentDetailPage = class _AgentDetailPage {
  route = inject(ActivatedRoute);
  personnelService = inject(PersonnelService);
  agent = {
    id: "",
    matricule: "",
    fullName: "",
    position: "",
    unit: "",
    email: "",
    phone: "",
    photoUrl: "./assets/images/faces/profile.jpg",
    careerEvents: [],
    documents: []
  };
  careerEvents = [];
  documents = [];
  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get("id");
      if (!id)
        return;
      this.personnelService.getAgentById(id).subscribe((details) => {
        if (!details)
          return;
        this.agent = details;
        this.careerEvents = details.careerEvents || [];
        this.documents = details.documents || [];
      });
    });
  }
  static \u0275fac = function AgentDetailPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AgentDetailPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AgentDetailPage, selectors: [["app-agent-detail"]], decls: 38, vars: 7, consts: [["nav", "ngbNav"], [1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-body", "d-md-flex"], ["alt", "", 1, "br-5", 3, "src"], [1, "my-md-auto", "mt-4", "prof-details"], [1, "font-weight-semibold", "ms-md-4", "mb-1"], [1, "fs-13", "text-muted", "ms-md-4", "mb-2"], [1, "me-3", "d-inline-block"], [1, "far", "fa-address-card", "me-2"], [1, "d-inline-block"], [1, "far", "fa-building", "me-2"], [1, "text-muted", "ms-md-4", "mb-2"], [1, "fa", "fa-envelope", "me-2"], [1, "text-muted", "ms-md-4", "mb-0"], [1, "fa", "fa-phone", "me-2"], [1, "card-footer", "py-0"], ["ngbNav", "", 1, "main-nav-line", "p-0", "tabs-menu", "profile-nav-line", "border-0", "br-5", "mb-0"], ["ngbNavItem", ""], ["ngbNavLink", "", 1, "mb-2", "mt-2"], ["ngbNavContent", ""], [1, "border-top-0", 3, "ngbNavOutlet"], [1, "p-4"], [1, "row"], [1, "col-md-4"], [1, "border-bottom", "pb-3", "mb-3"], [1, "fw-semibold"], [1, "text-muted"], [1, "p-4", "table-responsive"], [3, "tableClass", "columns", "data"], [1, "badge", "bg-success-transparent", "text-success"]], template: function AgentDetailPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "div", 3)(3, "div", 4)(4, "div");
      \u0275\u0275element(5, "img", 5);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 6)(7, "h4", 7);
      \u0275\u0275text(8);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "p", 8)(10, "span", 9);
      \u0275\u0275element(11, "i", 10);
      \u0275\u0275text(12);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(13, "span", 11);
      \u0275\u0275element(14, "i", 12);
      \u0275\u0275text(15);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(16, "p", 13);
      \u0275\u0275element(17, "i", 14);
      \u0275\u0275text(18);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(19, "p", 15);
      \u0275\u0275element(20, "i", 16);
      \u0275\u0275text(21);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(22, "div", 17)(23, "nav", 18, 0);
      \u0275\u0275elementContainerStart(25, 19);
      \u0275\u0275elementStart(26, "a", 20);
      \u0275\u0275text(27, "\xC9tat civil");
      \u0275\u0275elementEnd();
      \u0275\u0275template(28, AgentDetailPage_ng_template_28_Template, 17, 3, "ng-template", 21);
      \u0275\u0275elementContainerEnd();
      \u0275\u0275elementContainerStart(29, 19);
      \u0275\u0275elementStart(30, "a", 20);
      \u0275\u0275text(31, "Carri\xE8re");
      \u0275\u0275elementEnd();
      \u0275\u0275template(32, AgentDetailPage_ng_template_32_Template, 3, 0, "ng-template", 21);
      \u0275\u0275elementContainerEnd();
      \u0275\u0275elementContainerStart(33, 19);
      \u0275\u0275elementStart(34, "a", 20);
      \u0275\u0275text(35, "Documents");
      \u0275\u0275elementEnd();
      \u0275\u0275template(36, AgentDetailPage_ng_template_36_Template, 4, 10, "ng-template", 21);
      \u0275\u0275elementContainerEnd();
      \u0275\u0275elementEnd();
      \u0275\u0275element(37, "div", 22);
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      const nav_r4 = \u0275\u0275reference(24);
      \u0275\u0275advance(5);
      \u0275\u0275property("src", ctx.agent.photoUrl, \u0275\u0275sanitizeUrl);
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.agent.fullName);
      \u0275\u0275advance(4);
      \u0275\u0275textInterpolate(ctx.agent.position);
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.agent.unit);
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.agent.email);
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.agent.phone);
      \u0275\u0275advance(16);
      \u0275\u0275property("ngbNavOutlet", nav_r4);
    }
  }, dependencies: [NgbNavModule, NgbNavContent, NgbNav, NgbNavItem, NgbNavLink, NgbNavLinkBase, NgbNavOutlet, SpkReusableTables], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AgentDetailPage, [{
    type: Component,
    args: [{ selector: "app-agent-detail", standalone: true, imports: [NgbNavModule, SpkReusableTables], template: `<div class="row row-sm">
  <div class="col-xl-12">
    <div class="card custom-card">
      <div class="card-body d-md-flex">
        <div>
          <img [src]="agent.photoUrl" alt="" class="br-5" />
        </div>
        <div class="my-md-auto mt-4 prof-details">
          <h4 class="font-weight-semibold ms-md-4 mb-1">{{ agent.fullName }}</h4>
          <p class="fs-13 text-muted ms-md-4 mb-2">
            <span class="me-3 d-inline-block"><i class="far fa-address-card me-2"></i>{{ agent.position }}</span>
            <span class="d-inline-block"><i class="far fa-building me-2"></i>{{ agent.unit }}</span>
          </p>
          <p class="text-muted ms-md-4 mb-2"><i class="fa fa-envelope me-2"></i>{{ agent.email }}</p>
          <p class="text-muted ms-md-4 mb-0"><i class="fa fa-phone me-2"></i>{{ agent.phone }}</p>
        </div>
      </div>

      <div class="card-footer py-0">
        <nav ngbNav #nav="ngbNav" class="main-nav-line p-0 tabs-menu profile-nav-line border-0 br-5 mb-0">
          <ng-container ngbNavItem>
            <a ngbNavLink class="mb-2 mt-2">\xC9tat civil</a>
            <ng-template ngbNavContent>
              <div class="p-4">
                <div class="row">
                  <div class="col-md-4"><strong>Matricule</strong><div>{{ agent.matricule }}</div></div>
                  <div class="col-md-4"><strong>Fonction</strong><div>{{ agent.position }}</div></div>
                  <div class="col-md-4"><strong>Structure</strong><div>{{ agent.unit }}</div></div>
                </div>
              </div>
            </ng-template>
          </ng-container>

          <ng-container ngbNavItem>
            <a ngbNavLink class="mb-2 mt-2">Carri\xE8re</a>
            <ng-template ngbNavContent>
              <div class="p-4">
                @for (event of careerEvents; track event.date) {
                  <div class="border-bottom pb-3 mb-3">
                    <div class="fw-semibold">{{ event.title }}</div>
                    <div class="text-muted">{{ event.description }}</div>
                    <small class="text-muted">{{ event.date }}</small>
                  </div>
                }
              </div>
            </ng-template>
          </ng-container>

          <ng-container ngbNavItem>
            <a ngbNavLink class="mb-2 mt-2">Documents</a>
            <ng-template ngbNavContent>
              <div class="p-4 table-responsive">
                <spk-reusable-tables
                  [tableClass]="'table text-nowrap'"
                  [columns]="[
                    { header: 'Type' },
                    { header: 'R\xE9f\xE9rence' },
                    { header: 'Statut' }
                  ]"
                  [data]="documents"
                >
                  @for (doc of documents; track doc.reference) {
                    <tr>
                      <td>{{ doc.type }}</td>
                      <td>{{ doc.reference }}</td>
                      <td><span class="badge bg-success-transparent text-success">{{ doc.status }}</span></td>
                    </tr>
                  }
                </spk-reusable-tables>
              </div>
            </ng-template>
          </ng-container>
        </nav>
        <div class="border-top-0" [ngbNavOutlet]="nav"></div>
      </div>
    </div>
  </div>
</div>
` }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AgentDetailPage, { className: "AgentDetailPage", filePath: "src/app/modules/personnel/pages/agent-detail/agent-detail.ts", lineNumber: 13 });
})();
export {
  AgentDetailPage
};
//# sourceMappingURL=chunk-5AVJRTGY.js.map
