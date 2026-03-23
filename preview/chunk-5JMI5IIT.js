import {
  AuthService,
  ToastrModule,
  ToastrService
} from "./chunk-7GJ3LIE6.js";
import {
  NgbModule,
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavItemRole,
  NgbNavLink,
  NgbNavLinkBase,
  NgbNavOutlet
} from "./chunk-O2O2T4YI.js";
import {
  Router,
  RouterLink,
  RouterModule
} from "./chunk-4BN2KUUY.js";
import {
  DefaultValueAccessor,
  FormBuilder,
  FormControlName,
  FormGroupDirective,
  FormsModule,
  NgControlStatus,
  NgControlStatusGroup,
  ReactiveFormsModule,
  RequiredValidator,
  Validators,
  ɵNgNoValidate
} from "./chunk-U53XDZ2X.js";
import "./chunk-7C46ZOJO.js";
import "./chunk-BMX4STFJ.js";
import {
  Component,
  Renderer2,
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinterpolate1,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-MOIGQQUQ.js";
import "./chunk-KWSTWQNB.js";

// src/app/authentication/login/login.ts
var _c0 = () => ["/dashboards/dashboard-1"];
var _c1 = () => ["/pages/authentication/forgot-password"];
var _c2 = () => ["/pages/authentication/signup"];
var _c3 = () => ["/authentication/reset-password/basic"];
function Login_ng_template_27_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "form", 32);
    \u0275\u0275listener("ngSubmit", function Login_ng_template_27_Template_form_ngSubmit_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.Submit());
    });
    \u0275\u0275elementStart(1, "div", 33)(2, "label", 34);
    \u0275\u0275text(3, "User Name");
    \u0275\u0275elementEnd();
    \u0275\u0275element(4, "input", 35);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 36)(6, "label", 37);
    \u0275\u0275text(7, " Password ");
    \u0275\u0275elementStart(8, "a", 38);
    \u0275\u0275text(9, "Forget password ?");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "div", 39);
    \u0275\u0275element(11, "input", 40);
    \u0275\u0275elementStart(12, "button", 41);
    \u0275\u0275listener("click", function Login_ng_template_27_Template_button_click_12_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.toggleVisibility("Angular"));
    });
    \u0275\u0275element(13, "i");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "div", 42)(15, "div", 43);
    \u0275\u0275element(16, "input", 44);
    \u0275\u0275elementStart(17, "label", 45);
    \u0275\u0275text(18, " Remember password ? ");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(19, "div", 46)(20, "button", 47);
    \u0275\u0275text(21, "Sign In");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("formGroup", ctx_r2.angularLoginForm);
    \u0275\u0275advance(8);
    \u0275\u0275property("routerLink", "/pages/authentication/reset-password");
    \u0275\u0275advance(3);
    \u0275\u0275property("type", ctx_r2.visibilityMap["Angular"] ? "text" : "password");
    \u0275\u0275advance(2);
    \u0275\u0275classMap(\u0275\u0275interpolate1("", ctx_r2.iconMap["Angular"], " align-middle"));
    \u0275\u0275advance(7);
    \u0275\u0275property("disabled", !ctx_r2.angularLoginForm.valid || ctx_r2.authservice.showLoader);
  }
}
function Login_ng_template_31_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "form", 32);
    \u0275\u0275listener("ngSubmit", function Login_ng_template_31_Template_form_ngSubmit_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.login());
    });
    \u0275\u0275elementStart(1, "div", 33)(2, "label", 34);
    \u0275\u0275text(3, "User Name");
    \u0275\u0275elementEnd();
    \u0275\u0275element(4, "input", 48);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 36)(6, "label", 37);
    \u0275\u0275text(7, " Password ");
    \u0275\u0275elementStart(8, "a", 38);
    \u0275\u0275text(9, "Forget password ?");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "div", 39);
    \u0275\u0275element(11, "input", 49);
    \u0275\u0275elementStart(12, "button", 41);
    \u0275\u0275listener("click", function Login_ng_template_31_Template_button_click_12_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.toggleVisibility("Firebase"));
    });
    \u0275\u0275element(13, "i");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "div", 42)(15, "div", 43);
    \u0275\u0275element(16, "input", 50);
    \u0275\u0275elementStart(17, "label", 51);
    \u0275\u0275text(18, " Remember password ? ");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(19, "div", 46)(20, "button", 47);
    \u0275\u0275text(21, "Sign In");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("formGroup", ctx_r2.firebaseLoginForm);
    \u0275\u0275advance(8);
    \u0275\u0275property("routerLink", \u0275\u0275pureFunction0(7, _c3));
    \u0275\u0275advance(3);
    \u0275\u0275property("type", ctx_r2.visibilityMap["Firebase"] ? "text" : "password");
    \u0275\u0275advance(2);
    \u0275\u0275classMap(\u0275\u0275interpolate1("", ctx_r2.iconMap["Firebase"], " align-middle"));
    \u0275\u0275advance(7);
    \u0275\u0275property("disabled", !ctx_r2.firebaseLoginForm.valid || ctx_r2.authservice.showLoader);
  }
}
var Login = class _Login {
  authservice = inject(AuthService);
  router = inject(Router);
  formBuilder = inject(FormBuilder);
  renderer = inject(Renderer2);
  toastr = inject(ToastrService);
  disabled = "";
  active;
  showLoader;
  // public showPassword = false;
  angularLoginForm;
  firebaseLoginForm;
  email = "spruko@admin.com";
  password = "sprukoadmin";
  errorMessage = "";
  // validation error handle
  _error = { name: "", message: "" };
  // for firebase error handle
  loginForm;
  error = "";
  constructor() {
    const bodyElement = this.renderer.selectRootElement("body", true);
    this.renderer.setAttribute(bodyElement, "class", "error-page1 bg-primary");
  }
  ngOnInit() {
    this.angularLoginForm = this.formBuilder.group({
      username: ["spruko@admin.com", [Validators.required, Validators.email]],
      password: ["sprukoadmin", Validators.required]
    });
    this.firebaseLoginForm = this.formBuilder.group({
      username: ["spruko@admin.com", [Validators.required, Validators.email]],
      password: ["sprukoadmin", Validators.required]
    });
  }
  clearErrorMessage() {
    this.errorMessage = "";
    this._error = { name: "", message: "" };
  }
  login() {
    this.clearErrorMessage();
    const email = this.firebaseLoginForm.controls["username"].value;
    const password = this.firebaseLoginForm.controls["password"].value;
    if (this.validateForm(email, password)) {
      this.authenticate(email, password);
    } else {
      this.toastr.error("Identifiants invalides", "Primature RH", {
        timeOut: 3e3,
        positionClass: "toast-top-right"
      });
    }
  }
  validateForm(email, password) {
    if (email.length === 0) {
      this.errorMessage = "Please enter email id";
      return false;
    }
    if (password.length === 0) {
      this.errorMessage = "Please enter password";
      return false;
    }
    if (password.length < 6) {
      this.errorMessage = "Password should be at least 6 characters";
      return false;
    }
    this.errorMessage = "";
    return true;
  }
  get form() {
    return this.loginForm.controls;
  }
  Submit() {
    const { username, password } = this.angularLoginForm.controls;
    if (!this.validateForm(username.value, password.value)) {
      this.toastr.error("Identifiants invalides", "Primature RH", {
        timeOut: 3e3,
        positionClass: "toast-top-right"
      });
      return;
    }
    this.authenticate(username.value, password.value);
  }
  ngOnDestroy() {
    const bodyElement = this.renderer.selectRootElement("body", true);
    this.renderer.removeAttribute(bodyElement, "class");
  }
  visibilityMap = {
    Angular: false,
    Firebase: false
  };
  iconMap = {
    Angular: "fe fe-eye-off",
    Firebase: "fe fe-eye-off"
  };
  showPassword = false;
  toggleClass = "ri-eye-off-line";
  toggleVisibility(tab) {
    this.visibilityMap[tab] = !this.visibilityMap[tab];
    this.iconMap[tab] = this.visibilityMap[tab] ? "fe fe-eye" : "fe fe-eye-off";
  }
  authenticate(email, password) {
    this.authservice.loginWithEmail(email, password).then(() => {
      this.router.navigate(["/dashboard"]);
      this.toastr.success("Connexion r\xE9ussie", "Primature RH", {
        timeOut: 3e3,
        positionClass: "toast-top-right"
      });
    }).catch((error) => {
      this._error = error;
      this.toastr.error("Identifiants invalides", "Primature RH", {
        timeOut: 3e3,
        positionClass: "toast-top-right"
      });
    });
  }
  static \u0275fac = function Login_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Login)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _Login, selectors: [["app-login"]], features: [\u0275\u0275ProvidersFeature([{ provide: ToastrService, useClass: ToastrService }])], decls: 64, vars: 8, consts: [["nav", "ngbNav"], [1, "square-box"], [1, "container"], [1, "row", "justify-content-center", "align-items-center", "authentication", "authentication-basic", "h-100"], [1, "col-xl-5", "col-lg-6", "col-md-8", "col-sm-8", "col-xs-10", "card-sigin-main", "mx-auto", "my-auto", "py-4", "justify-content-center"], [1, "card-sigin"], [1, "main-card-signin", "d-md-flex"], [1, "wd-100p"], ["ngbNav", "", 1, "justify-content-center", "align-items-center", "custom-login-autentication", "authentication-tabs", "nav", "nav-pills", "nav-tabs", "border-0", "mb-2", 3, "activeIdChange", "activeId"], ["ngbNavItem", "Angular", 1, ""], ["ngbNavLink", ""], ["src", "./assets/images/angular.svg", "alt", "Angular", 1, "firebase"], ["ngbNavContent", ""], ["ngbNavItem", "Firebase", 1, ""], ["src", "./assets/images/firebase.svg", "alt", "Firebase", 1, "firebase"], [1, "d-flex", "mb-4"], [3, "routerLink"], ["src", "./assets/images/brand-logos/toggle-logo.png", "alt", "logo", 1, "sign-favicon", "ht-40"], [1, ""], [1, "main-signup-header"], [1, "font-weight-semibold", "mb-4"], [1, "panel", "panel-primary"], [1, "", 3, "ngbNavOutlet"], [1, "mt-4", "d-flex", "text-center", "justify-content-center", "mb-2"], ["href", "javascript:void(0);", 1, "btn", "btn-icon", "me-3"], [1, "btn-inner--icon"], [1, "bx", "bxl-facebook", "fs-18", "tx-prime"], [1, "ri-twitter-x-line", "fs-15", "tx-prime"], [1, "bx", "bxl-linkedin", "fs-18", "tx-prime"], [1, "bx", "bxl-instagram", "fs-18", "tx-prime"], [1, "main-signin-footer", "text-center", "mt-3"], [1, "mb-3", 3, "routerLink"], [3, "ngSubmit", "formGroup"], [1, "col-xl-12"], ["for", "signin-username", 1, "form-label", "text-default"], ["type", "text", "id", "signin-username", "placeholder", "user name", "formControlName", "username", "autocomplete", "", 1, "form-control", "mb-3"], [1, "col-xl-12", "mb-2"], ["for", "signin-password", 1, "form-label", "text-default", "d-block"], [1, "float-end", "text-danger", 3, "routerLink"], [1, "input-group"], ["formControlName", "password", "autocomplete", "", "id", "signin-password", "placeholder", "password", 1, "form-control", "form-control-lg", 3, "type"], ["type", "button", 1, "btn", "btn-light", "rounded-start-0", "custom-space-button", 3, "click"], [1, "mt-2"], [1, "form-check"], ["type", "checkbox", "value", "", "id", "defaultCheck1", 1, "form-check-input"], ["for", "defaultCheck1", 1, "form-check-label", "text-muted", "fw-normal"], [1, "col-xl-12", "d-grid", "mt-2"], ["type", "submit", 1, "btn", "btn-lg", "btn-primary", 3, "disabled"], ["type", "text", "id", "signin-username", "placeholder", "user name", "autocomplete", "", "formControlName", "username", "required", "", 1, "form-control", "mb-3"], ["formControlName", "password", "required", "", "id", "signin-password", "placeholder", "password", 1, "form-control", "form-control-lg", 3, "type"], ["type", "checkbox", "value", "", "id", "defaultCheck2", 1, "form-check-input"], ["for", "defaultCheck2", 1, "form-check-label", "text-muted", "fw-normal"]], template: function Login_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 1);
      \u0275\u0275element(1, "div")(2, "div")(3, "div")(4, "div")(5, "div")(6, "div")(7, "div")(8, "div")(9, "div")(10, "div")(11, "div")(12, "div")(13, "div")(14, "div")(15, "div");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(16, "div", 2)(17, "div", 3)(18, "div", 4)(19, "div", 5)(20, "div", 6)(21, "div", 7)(22, "ul", 8, 0);
      \u0275\u0275twoWayListener("activeIdChange", function Login_Template_ul_activeIdChange_22_listener($event) {
        \u0275\u0275restoreView(_r1);
        \u0275\u0275twoWayBindingSet(ctx.active, $event) || (ctx.active = $event);
        return \u0275\u0275resetView($event);
      });
      \u0275\u0275elementStart(24, "li", 9)(25, "a", 10);
      \u0275\u0275element(26, "img", 11);
      \u0275\u0275elementEnd();
      \u0275\u0275template(27, Login_ng_template_27_Template, 22, 7, "ng-template", 12);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(28, "li", 13)(29, "a", 10);
      \u0275\u0275element(30, "img", 14);
      \u0275\u0275elementEnd();
      \u0275\u0275template(31, Login_ng_template_31_Template, 22, 8, "ng-template", 12);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(32, "div", 15)(33, "a", 16);
      \u0275\u0275element(34, "img", 17);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(35, "div", 18)(36, "div", 19)(37, "h2");
      \u0275\u0275text(38, "Welcome back!");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(39, "h6", 20);
      \u0275\u0275text(40, "Please sign in to continue.");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(41, "div", 21);
      \u0275\u0275element(42, "div", 22);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(43, "div", 23)(44, "a", 24)(45, "span", 25);
      \u0275\u0275element(46, "i", 26);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(47, "a", 24)(48, "span", 25);
      \u0275\u0275element(49, "i", 27);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(50, "a", 24)(51, "span", 25);
      \u0275\u0275element(52, "i", 28);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(53, "a", 24)(54, "span", 25);
      \u0275\u0275element(55, "i", 29);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(56, "div", 30)(57, "p")(58, "a", 31);
      \u0275\u0275text(59, "Forgot password?");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(60, "p");
      \u0275\u0275text(61, "Don't have an account? ");
      \u0275\u0275elementStart(62, "a", 16);
      \u0275\u0275text(63, "Create an Account");
      \u0275\u0275elementEnd()()()()()()()()()()();
    }
    if (rf & 2) {
      const nav_r5 = \u0275\u0275reference(23);
      \u0275\u0275advance(22);
      \u0275\u0275twoWayProperty("activeId", ctx.active);
      \u0275\u0275advance(11);
      \u0275\u0275property("routerLink", \u0275\u0275pureFunction0(5, _c0));
      \u0275\u0275advance(9);
      \u0275\u0275property("ngbNavOutlet", nav_r5);
      \u0275\u0275advance(16);
      \u0275\u0275property("routerLink", \u0275\u0275pureFunction0(6, _c1));
      \u0275\u0275advance(4);
      \u0275\u0275property("routerLink", \u0275\u0275pureFunction0(7, _c2));
    }
  }, dependencies: [RouterModule, RouterLink, FormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, RequiredValidator, ReactiveFormsModule, FormGroupDirective, FormControlName, NgbModule, NgbNavContent, NgbNav, NgbNavItem, NgbNavItemRole, NgbNavLink, NgbNavLinkBase, NgbNavOutlet, ToastrModule], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Login, [{
    type: Component,
    args: [{ selector: "app-login", imports: [RouterModule, FormsModule, ReactiveFormsModule, NgbModule, ToastrModule], providers: [{ provide: ToastrService, useClass: ToastrService }], template: `<div class="square-box">\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
  <div></div>\r
</div>\r
<div class="container">\r
  <div class="row justify-content-center align-items-center authentication authentication-basic h-100">\r
    <div   class="col-xl-5 col-lg-6 col-md-8 col-sm-8 col-xs-10 card-sigin-main mx-auto my-auto py-4 justify-content-center">\r
      <div class="card-sigin">\r
        <!-- Demo content-->\r
        <div class="main-card-signin d-md-flex">\r
          <div class="wd-100p">\r
            <ul ngbNav #nav="ngbNav" [(activeId)]="active"\r
              class=" justify-content-center align-items-center custom-login-autentication authentication-tabs nav nav-pills nav-tabs border-0 mb-2">\r
              <!-- Angular Tab -->\r
              <li ngbNavItem="Angular" class="">\r
                <a ngbNavLink>\r
                  <img class="firebase" src="./assets/images/angular.svg" alt="Angular" />\r
                </a>\r
                <ng-template ngbNavContent>\r
                  <form [formGroup]="angularLoginForm" (ngSubmit)="Submit()">\r
\r
                    <div class="col-xl-12">\r
                      <label for="signin-username" class="form-label text-default">User Name</label>\r
                      <input type="text" class="form-control mb-3" id="signin-username" placeholder="user name"\r
                        formControlName="username" autocomplete />\r
                    </div>\r
                    <div class="col-xl-12 mb-2">\r
                      <label for="signin-password" class="form-label text-default d-block">\r
                        Password\r
                        <a [routerLink]="'/pages/authentication/reset-password'" class="float-end text-danger">Forget\r
                          password ?</a></label>\r
                      <div class="input-group">\r
                        <input formControlName="password" autocomplete\r
                          [type]="visibilityMap['Angular'] ? 'text' : 'password'" class="form-control form-control-lg"\r
                          id="signin-password" placeholder="password" />\r
                        <button class="btn btn-light rounded-start-0 custom-space-button" type="button"\r
                          (click)="toggleVisibility('Angular')">\r
                          <i class="{{ iconMap['Angular'] }} align-middle"></i>\r
                        </button>\r
                      </div>\r
                      <div class="mt-2">\r
                        <div class="form-check">\r
                          <input class="form-check-input" type="checkbox" value="" id="defaultCheck1" />\r
                          <label class="form-check-label text-muted fw-normal" for="defaultCheck1">\r
                            Remember password ?\r
                          </label>\r
                        </div>\r
                      </div>\r
                    </div>\r
                    <div class="col-xl-12 d-grid mt-2">\r
                      <button type="submit" [disabled]=" !angularLoginForm.valid || authservice.showLoader"\r
                        class="btn btn-lg btn-primary">Sign In</button>\r
                    </div>\r
                  </form>\r
                </ng-template>\r
\r
              </li>\r
              <li ngbNavItem="Firebase" class="">\r
                <a ngbNavLink>\r
                  <img class="firebase" src="./assets/images/firebase.svg" alt="Firebase" />\r
                </a>\r
                <ng-template ngbNavContent>\r
                  <form [formGroup]="firebaseLoginForm" (ngSubmit)="login()">\r
\r
                    <div class="col-xl-12">\r
                      <label for="signin-username" class="form-label text-default">User Name</label>\r
                      <input type="text" class="form-control  mb-3" id="signin-username" placeholder="user name"\r
                        autocomplete formControlName="username" required />\r
                    </div>\r
                    <div class="col-xl-12 mb-2">\r
\r
                      <label for="signin-password" class="form-label text-default d-block">\r
                        Password\r
                        <a [routerLink]="['/authentication/reset-password/basic']" class="float-end text-danger">Forget\r
                          password ?</a></label>\r
                      <div class="input-group">\r
                        <input [type]="visibilityMap['Firebase'] ? 'text' : 'password'" formControlName="password"\r
                          required class="form-control form-control-lg" id="signin-password" placeholder="password" />\r
                        <button class="btn btn-light rounded-start-0 custom-space-button" type="button"\r
                          (click)="toggleVisibility('Firebase')">\r
                          <i class="{{ iconMap['Firebase'] }} align-middle"></i>\r
                        </button>\r
                      </div>\r
                      <div class="mt-2">\r
                        <div class="form-check">\r
                          <input class="form-check-input" type="checkbox" value="" id="defaultCheck2" />\r
                          <label class="form-check-label text-muted fw-normal" for="defaultCheck2">\r
                            Remember password ?\r
                          </label>\r
                        </div>\r
                      </div>\r
\r
                    </div>\r
                    <div class="col-xl-12 d-grid mt-2">\r
                      <button type="submit" [disabled]="!firebaseLoginForm.valid || authservice.showLoader"\r
                        class="btn btn-lg btn-primary">Sign In</button>\r
                    </div>\r
                  </form>\r
                </ng-template>\r
              </li>\r
            </ul>\r
            <div class="d-flex mb-4"><a [routerLink]="['/dashboards/dashboard-1']"><img\r
                  src="./assets/images/brand-logos/toggle-logo.png" class="sign-favicon ht-40" alt="logo"></a></div>\r
            <div class="">\r
              <div class="main-signup-header">\r
                <h2>Welcome back!</h2>\r
                <h6 class="font-weight-semibold mb-4">Please sign in to continue.</h6>\r
                <div class="panel panel-primary">\r
                  <div class="" [ngbNavOutlet]="nav"></div>\r
                </div>\r
                <div class="mt-4 d-flex text-center justify-content-center mb-2">\r
                  <a href="javascript:void(0);" class="btn btn-icon me-3">\r
                    <span class="btn-inner--icon"> <i class="bx bxl-facebook fs-18 tx-prime"></i> </span>\r
                  </a>\r
                  <a href="javascript:void(0);" class="btn btn-icon me-3">\r
                    <span class="btn-inner--icon"> <i class="ri-twitter-x-line fs-15 tx-prime"></i> </span>\r
                  </a>\r
                  <a href="javascript:void(0);" class="btn btn-icon me-3">\r
                    <span class="btn-inner--icon"> <i class="bx bxl-linkedin fs-18 tx-prime"></i> </span>\r
                  </a>\r
                  <a href="javascript:void(0);" class="btn  btn-icon me-3">\r
                    <span class="btn-inner--icon"> <i class="bx bxl-instagram fs-18 tx-prime"></i> </span>\r
                  </a>\r
                </div>\r
                <div class="main-signin-footer text-center mt-3">\r
                  <p>\r
                    <a [routerLink]="['/pages/authentication/forgot-password']" class="mb-3">Forgot password?</a>\r
                  </p>\r
                  <p>Don't have an account? <a [routerLink]="['/pages/authentication/signup']">Create an Account</a>\r
                  </p>\r
                </div>\r
              </div>\r
            </div>\r
          </div>\r
        </div>\r
      </div>\r
    </div>\r
  </div>\r
</div>\r
` }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(Login, { className: "Login", filePath: "src/app/authentication/login/login.ts", lineNumber: 15 });
})();
export {
  Login
};
//# sourceMappingURL=chunk-5JMI5IIT.js.map
