"use client";

import * as React from "react";
import { MotionConfig } from "motion/react";
import { IconProvider } from "@/lib/icon-context";
import { hugeiconsIcons } from "@/lib/icons-hugeicons";

export function FluidRoot({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <IconProvider icons={hugeiconsIcons}>
        {children}
      </IconProvider>
    </MotionConfig>
  );
}
