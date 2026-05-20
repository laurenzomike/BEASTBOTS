## 2024-05-14 - Extract Invariant Computations in Loops
**Learning:** Performing invariant string operations (like `.toLowerCase()`) inside an array filter loop causes an O(N) redundant overhead.
**Action:** Always extract static or loop-invariant computations outside of loops (especially those used in `useMemo` for derived states) and employ short-circuit/fast-path condition checks (like empty string logic and status matching) first to avoid expensive operations.
