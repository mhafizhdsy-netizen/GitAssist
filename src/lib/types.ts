import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
};

export type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};
