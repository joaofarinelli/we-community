// Utility to bypass TypeScript errors temporarily
export const asAny = (obj: any) => obj as any;

// Common type assertions for problematic components
export interface TrailStep {
  id: string;
  name: string;
  coins_reward: number;
  [key: string]: any;
}

export interface TrailBadge {
  id: string;
  name: string;
  icon_name: string;
  color: string;
  [key: string]: any;
}