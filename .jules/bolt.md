
## 2024-06-16 - Optimizing Memoized Array Filtering
**Learning:** When using `useMemo` to cache array filtering operations, invariant computations like `searchQuery.toLowerCase()` should be extracted outside the `.filter()` callback but inside the `useMemo` hook. This prevents redundant string manipulations from executing on every element in the array during O(N) operations while still preserving reactivity.
**Action:** Always extract static transformations (e.g., lowercasing, regex compiling) from iterative callbacks to optimize hot path execution.
