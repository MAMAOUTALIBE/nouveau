import { describe, expect, it } from 'vitest';
import {
  INITIALS_AVATAR_PALETTE,
  computeBgColor,
  computeInitials,
} from './initials-avatar';

describe('InitialsAvatar — computeInitials', () => {
  it('computes initials from a two-word name (first + last)', () => {
    expect(computeInitials('Jean Doubon')).toBe('JD');
  });

  it('computes initials from a single word using first two letters', () => {
    expect(computeInitials('Aminata')).toBe('AM');
  });

  it('computes initials from a three-word name using first and last word', () => {
    expect(computeInitials('Aissatou Mariam Sylla')).toBe('AS');
  });

  it('falls back to "?" for empty or whitespace-only names', () => {
    expect(computeInitials('')).toBe('?');
    expect(computeInitials('   ')).toBe('?');
  });
});

describe('InitialsAvatar — computeBgColor', () => {
  it('returns a deterministic colour for the same name on multiple calls', () => {
    expect(computeBgColor('Mariam Diallo')).toBe(computeBgColor('Mariam Diallo'));
    expect(computeBgColor('Jean Doubon')).toBe(computeBgColor('Jean Doubon'));
  });

  it('returns different colours for clearly different names (palette spread >= 4)', () => {
    const sampleNames = [
      'Jean Doubon',
      'Aminata Toure',
      'Mariam Diallo',
      'Ousmane Bah',
      'Fatou Sow',
      'Ibrahima Cisse',
      'Kadiatou Camara',
      'Sekou Conde',
      'Mamadou Barry',
      'Aissatou Sylla',
    ];
    const colours = new Set(sampleNames.map((name) => computeBgColor(name)));
    // Au moins 4 couleurs distinctes pour 10 noms -> palette correctement distribuée
    expect(colours.size).toBeGreaterThanOrEqual(4);
  });

  it('falls back to palette[0] for empty or whitespace-only names', () => {
    expect(computeBgColor('')).toBe(INITIALS_AVATAR_PALETTE[0]);
    expect(computeBgColor('   ')).toBe(INITIALS_AVATAR_PALETTE[0]);
  });

  it('only returns colours from the WCAG-vetted palette', () => {
    const colour = computeBgColor('Ousmane Bah');
    expect(INITIALS_AVATAR_PALETTE).toContain(colour);
  });
});
