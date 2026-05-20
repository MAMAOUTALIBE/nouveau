import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  COOKIE_CONSENT_STORAGE_KEY,
  CookieConsentService,
  type CookieCategory,
} from './cookie-consent.service';

/**
 * Page de **gestion fine des préférences cookies**, accessible depuis le
 * footer ou le bandeau cookies. Toujours accessible sans authentification.
 *
 * Conforme à la doctrine RGPD : pas de dark pattern, choix granulaire,
 * possibilité de tout refuser sans pénalisation, persistance locale
 * (`localStorage`) — pas d'appel serveur (donc pas de tracker indirect).
 */
@Component({
  selector: 'app-cookie-preferences-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="container py-4" id="main">
      <a class="visually-hidden-focusable" href="#main">Aller au contenu</a>

      <header class="mb-4">
        <h1>Préférences cookies</h1>
        <p class="text-muted">
          Choisissez précisément les catégories que vous acceptez. Aucune n'est
          activée par défaut au-delà du strict nécessaire.
        </p>
      </header>

      <form (ngSubmit)="save()" class="needs-validation">
        <fieldset class="mb-3">
          <legend class="h5">Cookies strictement nécessaires</legend>
          <p class="text-muted small">
            Toujours actifs — indispensables au fonctionnement (authentification,
            sécurité CSRF). Vous ne pouvez pas les désactiver.
          </p>
          <input class="form-check-input" type="checkbox" checked disabled />
          <label class="form-check-label ms-2">Activés</label>
        </fieldset>

        <fieldset class="mb-3">
          <legend class="h5">Mémorisation interface</legend>
          <p class="text-muted small">
            Mémorise vos préférences (thème clair/sombre, état du menu) pour
            améliorer votre confort. Pas de transmission externe.
          </p>
          <input
            id="ui_prefs"
            class="form-check-input"
            type="checkbox"
            [(ngModel)]="prefs().ui_prefs"
            (ngModelChange)="updateUiPrefs($event)"
            name="ui_prefs"
          />
          <label class="form-check-label ms-2" for="ui_prefs">
            Autoriser la mémorisation de mes préférences d'interface
          </label>
        </fieldset>

        <fieldset class="mb-3">
          <legend class="h5">Mesure d'audience interne (anonymisée)</legend>
          <p class="text-muted small">
            Statistiques agrégées sur l'usage des modules pour orienter les
            améliorations. Pas de profil individuel, pas de cookie tiers.
          </p>
          <input
            id="analytics"
            class="form-check-input"
            type="checkbox"
            [(ngModel)]="prefs().analytics"
            (ngModelChange)="updateAnalytics($event)"
            name="analytics"
          />
          <label class="form-check-label ms-2" for="analytics">
            Autoriser la mesure d'audience anonymisée
          </label>
        </fieldset>

        <fieldset class="mb-4">
          <legend class="h5">Assistance IA (Prim'Assistant)</legend>
          <p class="text-muted small">
            Active l'historique conversationnel local pour personnaliser les
            réponses. Sans cette option, l'assistant fonctionne sans mémoire
            entre sessions.
          </p>
          <input
            id="ai_history"
            class="form-check-input"
            type="checkbox"
            [(ngModel)]="prefs().ai_history"
            (ngModelChange)="updateAiHistory($event)"
            name="ai_history"
          />
          <label class="form-check-label ms-2" for="ai_history">
            Autoriser l'historique d'assistance personnalisé
          </label>
        </fieldset>

        <div class="d-flex gap-2 flex-wrap">
          <button type="submit" class="btn btn-primary">Enregistrer mes préférences</button>
          <button type="button" class="btn btn-outline-secondary" (click)="acceptAll()">
            Tout accepter
          </button>
          <button type="button" class="btn btn-outline-secondary" (click)="refuseAll()">
            Tout refuser
          </button>
        </div>

        <p *ngIf="saved()" class="text-success mt-3" role="status">
          ✅ Préférences enregistrées localement (clé <code>{{ storageKey }}</code>).
        </p>
      </form>

      <footer class="mt-5 pt-3 border-top small text-muted">
        Pour comprendre quels cookies l'application utilise, consultez la
        <a routerLink="/cookies">politique cookies</a>.
      </footer>
    </main>
  `,
})
export class CookiePreferencesPage {
  private readonly consent = new CookieConsentService();
  protected readonly storageKey = COOKIE_CONSENT_STORAGE_KEY;
  protected readonly prefs = signal<Record<CookieCategory, boolean>>(this.consent.snapshot());
  protected readonly saved = signal(false);

  protected updateUiPrefs(value: boolean): void {
    this.prefs.update((p) => ({ ...p, ui_prefs: value }));
    this.saved.set(false);
  }

  protected updateAnalytics(value: boolean): void {
    this.prefs.update((p) => ({ ...p, analytics: value }));
    this.saved.set(false);
  }

  protected updateAiHistory(value: boolean): void {
    this.prefs.update((p) => ({ ...p, ai_history: value }));
    this.saved.set(false);
  }

  protected save(): void {
    this.consent.set(this.prefs());
    this.saved.set(true);
  }

  protected acceptAll(): void {
    const next: Record<CookieCategory, boolean> = {
      ui_prefs: true,
      analytics: true,
      ai_history: true,
    };
    this.prefs.set(next);
    this.consent.set(next);
    this.saved.set(true);
  }

  protected refuseAll(): void {
    const next: Record<CookieCategory, boolean> = {
      ui_prefs: false,
      analytics: false,
      ai_history: false,
    };
    this.prefs.set(next);
    this.consent.set(next);
    this.saved.set(true);
  }
}
