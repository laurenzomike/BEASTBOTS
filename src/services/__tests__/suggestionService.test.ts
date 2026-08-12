import { describe, it, expect, vi, beforeEach } from "vitest";
import { suggestWorkflows } from "../suggestionService";
import { PLATFORM_WORKFLOWS } from "../../constants";

// Use vi.hoisted to ensure the mock function is available before imports are evaluated
const { mockGenerateContent } = vi.hoisted(() => {
  return { mockGenerateContent: vi.fn() };
});

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

describe("suggestWorkflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Temporarily set a dummy API key for testing environment
    process.env.GEMINI_API_KEY = "test-api-key";
  });

  it("should return an empty array if an unknown botType is provided", async () => {
    const result = await suggestWorkflows("unknown-bot-type", "increase sales");
    expect(result).toEqual([]);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("should return suggested workflows when API call is successful", async () => {
    const mockResponse = [
      { trigger: "On Order Placed", action: "Draft Reorder", prompt: "Test prompt 1" },
      { trigger: "On Inventory Low", action: "Adjust Price", prompt: "Test prompt 2" }
    ];

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(mockResponse)
    });

    const result = await suggestWorkflows("shopify", "reduce manual work");

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
  });

  it("should pass existing workflows in the prompt to avoid duplicates", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify([])
    });

    const currentWorkflows = [
      { trigger: "On Customer Inquiry", action: "Auto-Response" }
    ];

    await suggestWorkflows("shopify", "improve customer service", currentWorkflows);

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.contents).toContain("Existing Workflows to avoid duplicates: On Customer Inquiry -> Auto-Response");
  });

  it("should return an empty array if the API throws an error", async () => {
    // Suppress console.error for this test to avoid noisy output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockGenerateContent.mockRejectedValueOnce(new Error("API Error"));

    const result = await suggestWorkflows("shopify", "test error");

    expect(result).toEqual([]);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  it("should return an empty array if the API returns invalid JSON", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockGenerateContent.mockResolvedValueOnce({
      text: "invalid json string"
    });

    const result = await suggestWorkflows("shopify", "test invalid json");

    expect(result).toEqual([]);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  it("should return an empty array if the API returns non-array JSON", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ message: "not an array" })
    });

    const result = await suggestWorkflows("shopify", "test non-array json");

    expect(result).toEqual([]);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
