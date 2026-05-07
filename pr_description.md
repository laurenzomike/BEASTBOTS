🧹 [code health improvement] Avoid using 'any' type in App.tsx

🎯 **What:** The type of the `lastRunTracker` ref in `src/App.tsx` has been explicitly typed to use `number` instead of `any`.
💡 **Why:** Explicitly typing the values to `number` (which corresponds to timestamps) improves type safety and codebase readability.
✅ **Verification:** Verified by checking that `Date.now()` is what is assigned and retrieved, running `npm run lint` with `tsc --noEmit`, and checking build process via `npm run build`.
✨ **Result:** A safer, more accurately typed `lastRunTracker` without relying on `any`.
