import { describe, expect, it, vi } from 'vitest';
import {
  formatEventDate,
  isToday,
  isTomorrow,
  getRelativeDateLabel,
} from '../dateUtils';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

describe('date utils', () => {
  it('detects today', () => {
    const iso = today.toISOString();
    expect(isToday(iso)).toBe(true);
    expect(getRelativeDateLabel(iso)).toBe('Today');
  });

  it('detects tomorrow', () => {
    const iso = tomorrow.toISOString();
    expect(isTomorrow(iso)).toBe(true);
    expect(getRelativeDateLabel(iso)).toBe('Tomorrow');
  });

  it('formats other dates', () => {
    const other = new Date('2024-01-05T00:00:00Z');
    const formatted = formatEventDate(other.toISOString());
    expect(formatted).toMatch(/05\.01\.2024|05.01.2024/);
  });
});
