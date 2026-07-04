## 2024-07-04 - O(N*M) Lookup Optimization in AppFleetGrid
**Learning:** Found an O(N*M) lookup in React render: `.find()` inside a `.map()` mapping active bots to their last activity log. `globalActivities.find(a => a.botId === bot.id)` within `activeBots.map(...)`.
**Action:** Replace this with an O(N+M) Map-based lookup memoized with `useMemo`, iterating backwards to guarantee the newest log is kept (if there are multiples) or forwards and checking for key existence. This pattern reduces complexity and prevents unnecessary re-calculations on every render.
