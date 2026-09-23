import { getDepartmentByCode } from '../data/departments';

const STORAGE_KEY_USER_DEPT = 'stop_carburant_user_dept';
const STORAGE_KEY_DETECTED_DEPT = 'stop_carburant_detected_dept';
const STORAGE_KEY_FUEL_TYPE = 'stop_carburant_fuel_type';

import type { FuelType } from './energyPrices';

/**
 * Retourne le type de carburant sauvegardé par l'utilisateur
 */
export function getSavedFuelType(): FuelType {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FUEL_TYPE);
    if (saved === 'diesel' || saved === 'essence' || saved === 'e85' || saved === 'all') {
      return saved as FuelType;
    }
  } catch {
    // Ignore
  }
  return 'all';
}

/**
 * Enregistre le choix du type de carburant de l'utilisateur
 */
export function saveUserFuelType(fuelType: FuelType): void {
  try {
    localStorage.setItem(STORAGE_KEY_FUEL_TYPE, fuelType);
  } catch {
    // Ignore
  }
}

/**
 * Retourne le code département sauvegardé par l'utilisateur ou détecté précédemment
 */
export function getSavedDepartmentCode(): string | null {
  try {
    const userChoice = localStorage.getItem(STORAGE_KEY_USER_DEPT);
    if (userChoice && getDepartmentByCode(userChoice)) {
      return userChoice;
    }
    const detected = localStorage.getItem(STORAGE_KEY_DETECTED_DEPT);
    if (detected && getDepartmentByCode(detected)) {
      return detected;
    }
  } catch {
    // LocalStorage indisponible ou bloqué
  }
  return null;
}

/**
 * Enregistre le choix explicite de l'utilisateur
 */
export function saveUserDepartmentCode(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_DEPT, code);
  } catch {
    // Ignore les erreurs de quota/stockage
  }
}

/**
 * Détecte le département à partir d'un code postal français
 */
export function parseDepartmentFromPostal(postal: string): string | null {
  if (!postal) return null;
  const clean = postal.trim();

  // Gestion de la Corse (20000 -> 2A, 20200 -> 2B)
  if (clean.startsWith('20')) {
    const num = parseInt(clean.slice(0, 5), 10);
    if (!isNaN(num)) {
      return num <= 20199 ? '2A' : '2B';
    }
    return '2A';
  }

  // Métropole (ex: 33000 -> 33, 75011 -> 75, 06000 -> 06)
  const match = clean.match(/^(\d{2})/);
  if (match && match[1]) {
    const code = match[1];
    if (getDepartmentByCode(code)) {
      return code;
    }
  }

  return null;
}

/**
 * Détecte passivement le département de l'internaute via son IP (sans pop-up navigateur)
 */
export async function detectUserDepartmentFromIP(): Promise<string | null> {
  // 1. Vérifier si l'utilisateur a déjà un choix sauvegardé
  const saved = getSavedDepartmentCode();
  if (saved) {
    return saved;
  }

  // 2. Détection silencieuse par IP (service rapide, sans cookie, sans demande de permission)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch('https://ipwho.is/', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.success && data.country_code === 'FR' && data.postal) {
      const deptCode = parseDepartmentFromPostal(String(data.postal));
      if (deptCode) {
        try {
          localStorage.setItem(STORAGE_KEY_DETECTED_DEPT, deptCode);
        } catch {
          // Ignore
        }
        return deptCode;
      }
    }
  } catch {
    // Si offline, adblocker ou timeout, repli transparent
  }

  return null;
}
