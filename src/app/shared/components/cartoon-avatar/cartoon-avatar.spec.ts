import { describe, expect, it } from 'vitest';
import {
  CARTOON_AVATAR_POOL_SIZE,
  buildCartoonUrl,
  padIndex,
  pickCartoonIndex,
} from './cartoon-avatar';

describe('CartoonAvatar — pickCartoonIndex', () => {
  it('retourne toujours un index dans [1..12] (jamais 0, jamais 13)', () => {
    const names = [
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
      'Z',
      'A very very long compound name with many tokens',
    ];
    for (const n of names) {
      const idx = pickCartoonIndex(n);
      expect(idx).toBeGreaterThanOrEqual(1);
      expect(idx).toBeLessThanOrEqual(CARTOON_AVATAR_POOL_SIZE);
    }
  });

  it('est déterministe : deux appels avec le même nom -> même index', () => {
    expect(pickCartoonIndex('Mariam Diallo')).toBe(pickCartoonIndex('Mariam Diallo'));
    expect(pickCartoonIndex('Jean Doubon')).toBe(pickCartoonIndex('Jean Doubon'));
    expect(pickCartoonIndex('Ousmane Bah')).toBe(pickCartoonIndex('Ousmane Bah'));
  });

  it('distribue suffisamment : 10 noms différents -> au moins 5 indices distincts', () => {
    const names = [
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
    const indices = new Set(names.map((n) => pickCartoonIndex(n)));
    expect(indices.size).toBeGreaterThanOrEqual(5);
  });

  it('fallback safe : nom vide -> 1', () => {
    expect(pickCartoonIndex('')).toBe(1);
    expect(pickCartoonIndex('   ')).toBe(1);
  });
});

describe('CartoonAvatar — padIndex', () => {
  it('pad un index 1 chiffre vers 2 chiffres', () => {
    expect(padIndex(7)).toBe('07');
    expect(padIndex(1)).toBe('01');
  });

  it('laisse intact un index 2 chiffres', () => {
    expect(padIndex(12)).toBe('12');
    expect(padIndex(10)).toBe('10');
  });
});

describe('CartoonAvatar — buildCartoonUrl', () => {
  it('génère une URL bien formée pour différents indices', () => {
    expect(buildCartoonUrl(1)).toBe('./assets/avatars/cartoon/avatar-01.svg');
    expect(buildCartoonUrl(7)).toBe('./assets/avatars/cartoon/avatar-07.svg');
    expect(buildCartoonUrl(12)).toBe('./assets/avatars/cartoon/avatar-12.svg');
  });

  it('compose correctement avec pickCartoonIndex pour des noms réels', () => {
    const url = buildCartoonUrl(pickCartoonIndex('Mariam Diallo'));
    expect(url).toMatch(/^\.\/assets\/avatars\/cartoon\/avatar-\d{2}\.svg$/);
  });
});
