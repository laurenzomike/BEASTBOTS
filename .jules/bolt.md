## 2025-02-28 - Optimize Array Filtering in Render Path
**Learning:** In React components rendering lists based on multiple filters, performing expensive string operations (`toLowerCase()`) inside the filter callback without memoization causes redundant O(N) operations on every render.
**Action:** Extract invariant computations (like converting a search query to lowercase) outside the `.filter()` callback but inside a `useMemo` block, and use short-circuit evaluation to place inexpensive checks (like status equality) before expensive ones (like string includes).
