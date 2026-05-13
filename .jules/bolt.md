## 2024-05-18 - App.tsx render optimization
**Learning:** Found an opportunity to optimize `filteredBots` by wrapping it in `useMemo` and moving the `.toLowerCase()` call out of the map operation. Also `filteredBots` is derived from `bots`, `searchQuery`, and `statusFilter`. In App.tsx `filteredBots` is calculated on every render.
**Action:** Use `useMemo` to cache `filteredBots` and optimize the filtering logic.
## 2024-05-18 - App.tsx useMemo filter optimizations
**Learning:** When filtering large arrays in React components, redundant operations like `.toLowerCase()` inside a filter callback function lead to significant performance overhead (O(N) unnecessary string operations). Wrapping the entire computation inside `useMemo` is not enough to get the best performance, it's also important to compute invariant values once *outside* the filter loop, inside the memo block.
**Action:** Always extract invariant string manipulations and calculations out of inner loops (`.map`, `.filter`) and wrap the overall data transformation in `useMemo` with minimal dependencies.
