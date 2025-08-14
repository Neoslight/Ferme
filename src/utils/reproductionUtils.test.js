import { describe, it, expect } from 'vitest';
import { calculateDueDate } from './reproductionUtils';

describe('calculateDueDate', () => {
  it('should calculate the correct due date for a Sheep', () => {
    // Gestation for a sheep is 152 days
    const matingDate = new Date('2024-01-01');
    const expectedDueDate = new Date('2024-06-01');

    const result = calculateDueDate(matingDate, 'Mouton');

    // Compare date parts only, ignoring time
    expect(result.getFullYear()).toBe(expectedDueDate.getFullYear());
    expect(result.getMonth()).toBe(expectedDueDate.getMonth());
    expect(result.getDate()).toBe(expectedDueDate.getDate());
  });

  it('should return null for an unknown species', () => {
    const matingDate = new Date('2024-01-01');
    const result = calculateDueDate(matingDate, 'Unknown Species');
    expect(result).toBeNull();
  });
});
