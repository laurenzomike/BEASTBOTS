## 2024-05-24 - React Array Filtering Bottleneck
**Learning:** React component re-renders that calculate derived state over arrays without useMemo trigger O(N) operations on every render, especially when performing redundant string lowercasing inside the filter predicate.
**Action:** Always wrap large array derived states in useMemo and extract invariant computations outside the filter callback.
