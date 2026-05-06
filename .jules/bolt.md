## 2024-05-06 - [React Performance] Missing useMemo in App.tsx
**Learning:** Found an un-memoized derived state `filteredBots` calculation inside `src/App.tsx` that runs on every render. Given this app may hold many bots, and the search performs nested lowercase string operations, this is O(N) string processing on every keypress or minor state change, leading to re-renders across the large fleet grid component.
**Action:** Always wrap heavy derived data computations, especially string-based array filtering, in `useMemo`.
