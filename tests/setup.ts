import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.scrollTo pour l'environnement JSDOM
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});
