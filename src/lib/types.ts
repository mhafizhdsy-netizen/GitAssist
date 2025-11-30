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

export type PricingPlan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  isPrimary: boolean;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type TeamMember = {
  name: string;
  role: string;
  avatar: string;
};
