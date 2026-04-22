## 2024-04-22 - Nested Component Definition in React

**Learning:** Declaring a component (like `Typewriter`) inside another component (like `App`) causes the nested component to be recreated on every single render of the parent component. This leads to complete unmounting and remounting of the nested component, resetting its internal state (in this case, resetting the `currentText` and `currentIndex` state of `Typewriter`, which restarts the animation unnecessarily or causes flickering) and defeating React's reconciliation process. This is a common React anti-pattern that can severely degrade performance, especially when the parent component rerenders frequently.

**Action:** Always define components outside the scope of other components. In `App.tsx`, the `Typewriter` component is defined *inside* `App()`. I will move the `Typewriter` component definition outside the `App()` component so it maintains its identity across renders of `App()`.
