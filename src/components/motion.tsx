import type { ReactNode } from "react";

import { LazyMotion, MotionConfig } from "motion/react";

/*
 * Motion for React is used only where layout animation is genuinely needed
 * (DESIGN.md §7). Features load asynchronously, so they stay out of the
 * startup bundle, and reducedMotion="user" honours the system setting.
 */

const loadFeatures = () => import("./motionFeatures").then((module) => module.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}

export { LayoutGroup, m } from "motion/react";

/** The nav indicator spring (≈ 220 ms settle). */
export const indicatorSpring = { type: "spring", stiffness: 500, damping: 38, mass: 0.8 } as const;
