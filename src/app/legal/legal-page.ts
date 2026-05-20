import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { LEGAL_CONTENT, type LegalPageContent } from './legal-content';

/**
 * Composant générique de rendu d'une page légale.
 *
 * Le slug est passé via `data: { slug }` dans `legal.routes.ts`. Le contenu
 * est récupéré dans `LEGAL_CONTENT` (statique, pas d'appel réseau ⇒ pages
 * disponibles offline / bandeau cookies / mode dégradé).
 *
 * Note : les liens internes intégrés dans `[innerHTML]` utilisent `<a href>`
 * standard plutôt que `routerLink`. Pour ces pages publiques, un full reload
 * est acceptable et garantit la simplicité d'audit (pas de hijack JS).
 */
@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="container py-4 legal-page" id="main">
      <a class="visually-hidden-focusable" href="#main">Aller au contenu</a>

      <header class="mb-4">
        <h1 class="mb-2">{{ content().title }}</h1>
        <p *ngIf="content().subtitle" class="text-muted">{{ content().subtitle }}</p>
        <p class="small text-muted">
          Dernière mise à jour :
          <time [attr.datetime]="content().lastUpdated">{{ content().lastUpdated }}</time>
          <span *ngIf="content().status === 'draft-juridique'" class="badge bg-warning text-dark ms-2">
            Validation juridique en cours
          </span>
        </p>
      </header>

      <p *ngIf="content().intro" class="lead">{{ content().intro }}</p>

      <section *ngFor="let section of content().sections" class="mb-4">
        <h2 class="h4">{{ section.heading }}</h2>
        <div [innerHTML]="section.html"></div>
      </section>

      <footer *ngIf="content().contactBlock" class="border-top pt-3 mt-5">
        <p [innerHTML]="content().contactBlock"></p>
      </footer>
    </main>
  `,
  styles: [
    `
      .legal-page {
        max-width: 820px;
      }
      .legal-page h2 {
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
      }
      .legal-page :is(p, li) {
        line-height: 1.6;
      }
      .legal-page code {
        background: rgba(0, 0, 0, 0.05);
        padding: 0.05em 0.25em;
        border-radius: 3px;
      }
    `,
  ],
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);

  private readonly slug = signal<string>(this.route.snapshot.data['slug'] ?? 'mentions-legales');

  readonly content = computed<LegalPageContent>(() => {
    const value = LEGAL_CONTENT[this.slug()];
    if (!value) {
      // Fallback défensif — ne devrait pas arriver car routes contrôlées.
      return LEGAL_CONTENT['mentions-legales'];
    }
    return value;
  });
}
