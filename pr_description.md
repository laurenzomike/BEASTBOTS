🎯 **What:**
The `suggestionService.ts` module was completely lacking test coverage, notably missing validation for the `suggestWorkflows` function's error handling. Mocking the `@google/genai` module is tricky because it is initialized at the module level. We needed an effective testing strategy to ensure error boundaries and correct responses were intact.

📊 **Coverage:**
The newly introduced tests provide coverage for:
- Invalid or missing `botType` inputs.
- Valid response parsing (the happy path returning JSON workflow objects).
- Error scenario: catching an AI generation failure (API crash).
- Edge scenario: catching invalid JSON returned by the AI.

✨ **Result:**
By leveraging `vi.mock()` in Vitest, we successfully circumvented the module-level initialization hurdle. The codebase now has reliable test coverage for `suggestionService`, preventing undetected regressions in business-logic workflows and improving system reliability.
