import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CookieConsentService } from './cookie-consent.service';

/**
 * Bandeau cookies discret (pas de modal bloquant — anti-dark-pattern).
 *
 * Affiche en bas d'écran une bannière persistante tant que l'utilisateur
 * n'a pas exprimé son choix. Trois actions : tout accepter, tout refuser,
 * personnaliser (lien vers `/preferences-cookies`).
 *
 * À insérer dans le shell global (`app.html`) ou dans `ContentLayout` /
 * `AuthenticationLayout` — pas dans les routes des pages légales pour
 * éviter une boucle visuelle quand on lit la politique cookies.
 */
@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside
      *ngIf="visible()"
      class="cookie-banner"
      role="region"
      aria-label="Bandeau d'information sur les cookies"
    >
      <div class="cookie-banner__inner container">
        <div class="cookie-banner__text">
          <strong>Cookies et confidentialité.</strong>
          Cette application utilise uniquement des cookies strictement nécessaires
          par défaut. Vous pouvez activer des fonctionnalités complémentaires
          (mémorisation d'interface, statistiques d'usage anonymisées, mémoire
          d'assistant) si vous le souhaitez.
          <a routerLink="/cookies">En savoir plus</a>.
        </div>
        <div class="cookie-banner__actions" role="group" aria-label="Choix de consentement">
          <button type="button" class="btn btn-sm btn-outline-light" (click)="refuseAll()">
            Tout refuser
          </button>
          <a routerLink="/preferences-cookies" class="btn btn-sm btn-outline-light">
            Personnaliser
          </a>
          <button type="button" class="btn btn-sm btn-primary" (click)="acceptAll()">
            Tout accepter
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [
    `
      .cookie-banner {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1080;
        background: rgba(15, 23, 42, 0.96);
        color: #fff;
        padding: 0.75rem 0;
        box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.3);
      }
      .cookie-banner__inner {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .cookie-banner__text {
        flex: 1 1 360px;
        font-size: 0.9rem;
        line-height: 1.4;
      }
      .cookie-banner__text a {
        color: #93c5fd;
        text-decoration: underline;
      }
      .cookie-banner__actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      @media (max-width: 575px) {
        .cookie-banner__inner {
          flex-direction: column;
          align-items: stretch;
        }
        .cookie-banner__actions {
          justify-content: stretch;
        }
        .cookie-banner__actions > * {
          flex: 1;
        }
      }
    `,
  ],
})
export class CookieBanner {
  private readonly consent = inject(CookieConsentService);

  protected readonly visible = computed(() => !this.consent.decided());

  protected acceptAll(): void {
    this.consent.acceptAll();
  }

  protected refuseAll(): void {
    this.consent.refuseAll();
  }
}
