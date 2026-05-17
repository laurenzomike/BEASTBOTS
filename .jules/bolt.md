## 2024-11-20 - [React Array Filter Optimization]
**Learning:** In large React component trees filtering arrays during render without memoization and without extracting invariant computations (like converting the filter query to lower case on every item) causes significant repetitive CPU overhead.
**Action:** Always wrap `.filter` operations for lists derived from state in `useMemo` blocks. Extract computations such as `query.toLowerCase()` outside the `.filter` loop and employ short-circuit evaluations (e.g. evaluating enums/booleans before costly string matching).
