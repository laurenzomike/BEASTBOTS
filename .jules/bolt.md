
## 2024-05-26 - React Array Filtering Optimization
**Learning:** Filtering large arrays during renders without `useMemo` triggers `O(N)` string operations on every re-render. Additionally, performing static transformations (like `.toLowerCase()` on the search query) inside the filter callback causes redundant allocations and calculations `N` times per render.
**Action:** When filtering arrays in React based on state, always wrap the logic in `useMemo`. Pre-compute static values (like lowercased queries) outside the `.filter` loop but inside the `useMemo` hook to reduce computational complexity. Also leverage short-circuiting: evaluate simple equality conditions (like status matching) before expensive string comparisons.
