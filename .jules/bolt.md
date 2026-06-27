## 2024-06-27 - Caching Invariant Operations in Array Loops
**Learning:** Calling invariant operations like `.toLowerCase()` on a search string inside a `.filter()` or `.map()` loop causes O(N) redundant calculations. Caching this value outside the loop path can improve string processing speed by ~50%.
**Action:** Always extract invariant string operations and cache them in local variables before filtering or iterating over arrays in React components, and wrap the derived state inside a `useMemo` block.
