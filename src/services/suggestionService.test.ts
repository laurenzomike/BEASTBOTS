import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: (...args: any[]) => mockGenerateContent(...args)
      }
    }
  };
});

import { suggestWorkflows } from './suggestionService';

describe('suggestWorkflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return empty array if botType is invalid', async () => {
    const result = await suggestWorkflows('invalid_bot', 'goal');
    expect(result).toEqual([]);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('should return parsed suggestions on success', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify([
        { trigger: 'Scheduled Sync', action: 'Auto-Response', prompt: 'test' }
      ])
    });

    const result = await suggestWorkflows('shopify', 'my goal', [{ trigger: 'On Inventory Low', action: 'Draft Reorder' }]);

    expect(result).toEqual([
      { trigger: 'Scheduled Sync', action: 'Auto-Response', prompt: 'test' }
    ]);
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('should return empty array and log error when generateContent fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('AI generation failed'));

    const result = await suggestWorkflows('shopify', 'my goal');

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Suggestion error:', expect.any(Error));
  });

  it('should return empty array and log error when AI response is invalid JSON', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'invalid json'
    });

    const result = await suggestWorkflows('shopify', 'my goal');

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Suggestion error:', expect.any(Error));
  });
});
