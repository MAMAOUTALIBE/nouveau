import { Component, computed, input, signal } from '@angular/core';
import { InitialsAvatar } from '../initials-avatar/initials-avatar';

/**
 * Pool de 12 SVG cartoon (DiceBear avataaars) téléchargés en local sous
 * `src/assets/avatars/cartoon/avatar-XX.svg`. L'index 1..N est choisi de
 * façon déterministe à partir du nom de l'agent (djb2 — même algo que
 * `initials-avatar`), pour qu'un agent garde toujours le même avatar.
 */
export const CARTOON_AVATAR_POOL_SIZE = 12;

/**
 * Hash djb2 stable -> index 1..poolSize (jamais 0, jamais > poolSize).
 * Fallback safe : nom vide -> 1.
 */
export function pickCartoonIndex(rawName: string, poolSize: number = CARTOON_AVATAR_POOL_SIZE): number {
  const n = (rawName || '').trim();
  if (!n) return 1;
  let h = 5381;
  for (let i = 0; i < n.length; i++) {
    h = (h << 5) + h + n.charCodeAt(i);
    h = h & h; // garder int 32 bits
  }
  return (Math.abs(h) % poolSize) + 1;
}

/** Pad un index 1..99 en string 2 digits ("07", "12"). */
export function padIndex(index: number): string {
  return String(index).padStart(2, '0');
}

/** Construit l'URL de l'asset SVG pour un index donné. */
export function buildCartoonUrl(index: number): string {
  return `./assets/avatars/cartoon/avatar-${padIndex(index)}.svg`;
}

@Component({
  selector: 'cartoon-avatar',
  standalone: true,
  imports: [InitialsAvatar],
  template: `
    @if (imageFailed()) {
      <initials-avatar [name]="name()" [size]="size()" />
    } @else {
      <img
        [src]="avatarUrl()"
        [alt]="'Avatar de ' + name()"
        class="cartoon-avatar"
        [class.cartoon-avatar--sm]="size() === 'sm'"
        [class.cartoon-avatar--md]="size() === 'md'"
        [class.cartoon-avatar--lg]="size() === 'lg'"
        role="img"
        (error)="onError()" />
    }
  `,
  styles: [
    `
      .cartoon-avatar {
        display: inline-block;
        border-radius: 50%;
        object-fit: cover;
        background: #fff;
        flex-shrink: 0;
      }
      .cartoon-avatar--sm {
        width: 2rem;
        height: 2rem;
      }
      .cartoon-avatar--md {
        width: 2.75rem;
        height: 2.75rem;
      }
      .cartoon-avatar--lg {
        width: 4rem;
        height: 4rem;
      }
    `,
  ],
})
export class CartoonAvatar {
  readonly name = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('sm');

  /** Filet de sécurité : si l'image rate (404, réseau), on bascule sur les initiales. */
  readonly imageFailed = signal(false);

  readonly avatarIndex = computed(() => pickCartoonIndex(this.name()));
  readonly avatarUrl = computed(() => buildCartoonUrl(this.avatarIndex()));

  onError(): void {
    this.imageFailed.set(true);
  }
}
