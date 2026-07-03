## 2025-02-28 - Optimize array lookups inside map loop
**Learning:** O(N*M) lookups (`array.find` inside `array.map`) can be unexpectedly slow when the arrays grow large in React render functions. Using an O(1) Lookup Map constructed with `React.useMemo` reduces the complexity to O(N+M).
**Action:** When mapping over large arrays where an inner lookup is needed, always prefer constructing a Map and passing it into the loop, rather than doing `.find()` inside the map.
