import { Injectable, signal } from '@angular/core';

/**
 * Catégories de consentement non strictement nécessaire.
 *
 * Les cookies « strictement nécessaires » (session, CSRF) ne sont pas dans
 * cette liste : ils ne nécessitent pas de consentement (cf. directive ePrivacy
 * équivalente et bonne pratique CNPDP-GN).
 */
export type CookieCategory = 'ui_prefs' | 'analytics' | 'ai_history';

export const COOKIE_CONSENT_STORAGE_KEY = 'gpa-gouve.cookie-consent.v1';
export const COOKIE_CONSENT_DECIDED_KEY = 'gpa-gouve.cookie-consent.decided.v1';

const DEFAULTS: Readonly<Record<CookieCategory, boolean>> = Object.freeze({
  ui_prefs: false,
  analytics: false,
  ai_history: false,
});

/**
 * Service léger de gestion du consentement cookies.
 *
 * Pas de dépendance à HttpClient ni à un backend : tout est stocké dans
 * `localStorage`. C'est délibéré pour que le bandeau cookies soit servi
 * **avant tout appel réseau authentifié** et fonctionne en mode dégradé.
 */
@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private readonly state = signal<Record<CookieCategory, boolean>>(this.load());
  private readonly decidedSignal = signal<boolean>(this.hasUserDecided());

  readonly current = this.state.asReadonly();
  readonly decided = this.decidedSignal.asReadonly();

  snapshot(): Record<CookieCategory, boolean> {
    return { ...this.state() };
  }

  set(prefs: Record<CookieCategory, boolean>): void {
    const sanitized: Record<CookieCategory, boolean> = {
      ui_prefs: !!prefs.ui_prefs,
      analytics: !!prefs.analytics,
      ai_history: !!prefs.ai_history,
    };
    this.state.set(sanitized);
    try {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(sanitized));
      localStorage.setItem(COOKIE_CONSENT_DECIDED_KEY, '1');
      this.decidedSignal.set(true);
    } catch {
      // localStorage indisponible (mode privé strict, quota dépassé) — on
      // ignore silencieusement, l'utilisateur reverra le bandeau au refresh.
    }
  }

  acceptAll(): void {
    this.set({ ui_prefs: true, analytics: true, ai_history: true });
  }

  refuseAll(): void {
    this.set({ ui_prefs: false, analytics: false, ai_history: false });
  }

  isAllowed(category: CookieCategory): boolean {
    return !!this.state()[category];
  }

  private hasUserDecided(): boolean {
    try {
      return localStorage.getItem(COOKIE_CONSENT_DECIDED_KEY) === '1';
    } catch {
      return false;
    }
  }

  private load(): Record<CookieCategory, boolean> {
    try {
      const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULTS };
      }
      const parsed = JSON.parse(raw) as Partial<Record<CookieCategory, unknown>>;
      return {
        ui_prefs: !!parsed?.ui_prefs,
        analytics: !!parsed?.analytics,
        ai_history: !!parsed?.ai_history,
      };
    } catch {
      return { ...DEFAULTS };
    }
  }
}
