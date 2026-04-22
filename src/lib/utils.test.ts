import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('merges tailwind classes correctly', () => {
    // Basic test
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');

    // Testing conditional classes (clsx feature)
    expect(cn('bg-red-500', false && 'text-white', true && 'p-4')).toBe('bg-red-500 p-4');

    // Testing overriding duplicate properties (twMerge feature)
    expect(cn('px-2 py-1 bg-red-500', 'p-4 bg-blue-500')).toBe('p-4 bg-blue-500');
  });
});
