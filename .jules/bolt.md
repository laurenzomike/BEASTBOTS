## 2024-05-15 - O(N*M) Lookup bottleneck in BotCard component
**Learning:** Nested array operations (`.find()` within `.map()`) inside JSX cause massive O(N*M) bottlenecks during fleet grid rendering, as they run on every React render cycle for every card.
**Action:** Replaced inline `.map().find()` array logic with a memoized O(1) Lookup Map constructed via `useMemo` outside of the JSX block. Used `for` loops and ensured Map is only set if the key does not exist to preserve original search behavior.
