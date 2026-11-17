import type { LucideIcon } from "lucide-react";

export type LandingBillingCycle = "MONTHLY" | "YEARLY";

export type LandingPlanCode = "STANDARD" | "PRO" | "BUSINESS";

export interface LandingFeature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface LandingPlan {
  code: LandingPlanCode;
  name: string;
  tagline: string;
  /** Whole pesos (MXN). Both cycles are written out — never derive one from the other. */
  monthlyPrice: number;
  yearlyPrice: number;
  stations: string;
  features: readonly string[];
  featured: boolean;
}
