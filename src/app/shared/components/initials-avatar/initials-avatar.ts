import { Component, computed, input } from '@angular/core';

// Palette de 10 couleurs accessibles (contraste WCAG AA avec texte blanc).
// Doit être déterministe : même nom -> même couleur (hash modulo).
export const INITIALS_AVATAR_PALETTE: readonly string[] = [
  '#5b6ee1',
  '#38a3a5',
  '#e07a5f',
  '#81b29a',
  '#3d5a80',
  '#ee6c4d',
  '#9b5de5',
  '#0077b6',
  '#f4a261',
  '#2a9d8f',
];

export function computeInitials(rawName: string): string {
  const n = (rawName || '').trim();
  if (!n) return '?';
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function computeBgColor(
  rawName: string,
  palette: readonly string[] = INITIALS_AVATAR_PALETTE,
): string {
  const n = (rawName || '').trim();
  if (!n) return palette[0];
  // Hash simple stable (djb2-like) - pas crypto, juste déterministe
  let h = 5381;
  for (let i = 0; i < n.length; i++) {
    h = (h << 5) + h + n.charCodeAt(i);
    h = h & h; // garder int 32 bits
  }
  return palette[Math.abs(h) % palette.length];
}

@Component({
  selector: 'initials-avatar',
  standalone: true,
  template: `
    <span
      class="initials-avatar"
      [class.initials-avatar--sm]="size() === 'sm'"
      [class.initials-avatar--md]="size() === 'md'"
      [class.initials-avatar--lg]="size() === 'lg'"
      [style.background-color]="bgColor()"
      [attr.aria-label]="'Avatar de ' + name()"
      role="img">
      {{ initials() }}
    </span>
  `,
  styles: [
    `
      .initials-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: #fff;
        font-weight: 600;
        text-transform: uppercase;
        line-height: 1;
        user-select: none;
        flex-shrink: 0;
      }
      .initials-avatar--sm {
        width: 2rem;
        height: 2rem;
        font-size: 0.75rem;
      }
      .initials-avatar--md {
        width: 2.75rem;
        height: 2.75rem;
        font-size: 1rem;
      }
      .initials-avatar--lg {
        width: 4rem;
        height: 4rem;
        font-size: 1.5rem;
      }
    `,
  ],
})
export class InitialsAvatar {
  readonly name = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('sm');

  readonly initials = computed(() => computeInitials(this.name()));
  readonly bgColor = computed(() => computeBgColor(this.name()));
}
