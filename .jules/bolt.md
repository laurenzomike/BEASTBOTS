## 2026-04-29 - Unused Variable Removal Safety
**Learning:** Removing an apparently unused variable (like `uniqueBots`) can be flagged as a critical risk by reviewers who assume it is used in the JSX. However, if `tsc --noEmit` passes successfully after removal, it proves the variable was truly unused and the removal is safe.
**Action:** Always verify unused variable deletions with `tsc --noEmit` (or equivalent linter) and explicitly state in the PR description that the linter confirms the variable was unused to preempt reviewer concerns.
