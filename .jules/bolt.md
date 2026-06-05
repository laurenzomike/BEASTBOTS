
## 2024-05-18 - AppFleetGrid Log Render Loop
**Learning:** In the `AppFleetGrid` component, mapping over thousands of items using `.find()` inside the map loop resulted in exponential render times ($O(N \times M)$). Finding arrays inside maps during react render loops is a significant bottleneck.
**Action:** Replaced `.find()` with an $O(1)$ lookup Map via `useMemo` for activity logs. When pairing active items to their log history, always build a Map to reduce render complexity from $O(N \times M)$ to $O(N+M)$.
