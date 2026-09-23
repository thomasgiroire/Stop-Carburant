import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseDepartmentFromPostal,
  getSavedDepartmentCode,
  saveUserDepartmentCode,
} from '../src/services/geoService';

describe('Service de Géolocalisation Silencieux (geoService)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('extrait le code département correct à partir d\'un code postal métropolitain', () => {
    expect(parseDepartmentFromPostal('33000')).toBe('33'); // Gironde
    expect(parseDepartmentFromPostal('75001')).toBe('75'); // Paris
    expect(parseDepartmentFromPostal('06000')).toBe('06'); // Alpes-Maritimes
    expect(parseDepartmentFromPostal('69002')).toBe('69'); // Rhône
  });

  it('gère correctement les codes postaux de Corse (2A et 2B)', () => {
    expect(parseDepartmentFromPostal('20000')).toBe('2A'); // Ajaccio
    expect(parseDepartmentFromPostal('20167')).toBe('2A');
    expect(parseDepartmentFromPostal('20200')).toBe('2B'); // Bastia
    expect(parseDepartmentFromPostal('20600')).toBe('2B');
  });

  it('retourne null pour un code postal invalide ou vide', () => {
    expect(parseDepartmentFromPostal('')).toBeNull();
    expect(parseDepartmentFromPostal('abcde')).toBeNull();
  });

  it('sauvegarde et récupère le choix de département dans le localStorage', () => {
    expect(getSavedDepartmentCode()).toBeNull();
    saveUserDepartmentCode('33');
    expect(getSavedDepartmentCode()).toBe('33');
  });
});
