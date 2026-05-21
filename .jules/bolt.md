## 2023-10-27 - O(N*M) Rendering Optimization
**Learning:** In AppFleetGrid.tsx, a nested `globalActivities.find(...)` lookup was causing O(N*M) complexity on every render because `globalActivities` (M) is an array of activities for all bots and `activeBots` (N) is an array of bots.
**Action:** When finding the first match in an array to map onto another, build an O(1) lookup Map `activityMap` initialized with a `useMemo` block that only stores the first element (by iterating forwards and doing `!map.has(key)`). This reduces complexity to O(N+M) while matching the exact behavior of `find()`.
