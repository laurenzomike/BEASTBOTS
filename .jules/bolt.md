## 2024-04-23 - App re-render string allocation
**Learning:** React component re-renders that re-evaluate variables dynamically inside `.filter` array loops (like string `toLowerCase()`) trigger excessive memory allocations per element.
**Action:** When filtering array variables, hoist invariant conditions out of loops and wrap filtering logics inside `useMemo` specifically when filtering values over larger datasets in App context states.
