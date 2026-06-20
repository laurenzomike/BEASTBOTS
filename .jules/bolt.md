## 2024-06-20 - Memoizing Filtered Arrays with Redundant String Operations
**Learning:** React performance can degrade when `.filter` operations perform redundant computations (e.g. `toLowerCase()`) on invariant external variables on every render loop.
**Action:** When memoizing array filtering logic using `useMemo`, extract invariant computations outside of the `.filter()` callback but inside the memoization block to prevent redundant O(N) operations on every render.
