## 2025-04-28 - React useMemo array optimization
**Learning:** React frequently re-evaluates heavy array operations (filter, reduce, Object.entries) during basic state updates if not wrapped in useMemo.
**Action:** Wrap static array manipulations inside useMemo with careful dependency arrays to prevent N+1 CPU cycles on simple re-renders.
