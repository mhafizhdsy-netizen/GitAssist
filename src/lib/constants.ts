import { Github, Zap, ShieldCheck, UploadCloud, FileArchive, Code, Users } from "lucide-react";
import type { NavItem, FeatureCard, PricingPlan, FAQItem, TeamMember } from "@/lib/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "FAQ", href: "#faq" },
];

export const FEATURES: FeatureCard[] = [
  {
    icon: Github,
    title: "GitHub Integration",
    description: "Securely authenticate with your GitHub account and manage repositories directly.",
    color: "purple",
  },
  {
    icon: UploadCloud,
    title: "Drag & Drop Upload",
    description: "Easily upload files with a modern drag-and-drop interface, with progress indicators.",
    color: "blue",
  },
  {
    icon: FileArchive,
    title: "Automatic ZIP Extraction",
    description: "Upload ZIP archives and have them automatically extracted into your repository.",
    color: "green",
  },
  {
    icon: Code,
    title: "AI Commit Assistant",
    description: "Generate insightful commit messages from your file changes using generative AI.",
    color: "pink",
  },
  {
    icon: Zap,
    title: "Batch Uploads",
    description: "Save time by uploading multiple files and folders at once efficiently.",
    color: "yellow",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    description: "Your data is stored securely, and we respect your privacy. No compromises.",
    color: "indigo",
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free Forever",
    price: "$0",
    description: "For individuals and small teams getting started.",
    features: [
      "GitHub Authentication",
      "Unlimited Public Repositories",
      "AI Commit Suggestions (10/day)",
      "Batch Uploads",
      "Community Support",
    ],
    cta: "Get Started for Free",
    isPrimary: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with specific needs.",
    features: [
      "Everything in Free, plus:",
      "Unlimited Private Repositories",
      "Priority Support",
      "On-premise Deployment Options",
      "Custom Integrations",
    ],
    cta: "Contact Sales",
    isPrimary: false,
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Is GitAssist free to use?",
    answer:
      "Yes, GitAssist offers a generous 'Free Forever' plan that includes all core features for public repositories. We believe in providing powerful tools to the developer community.",
  },
  {
    question: "How does the AI commit message generation work?",
    answer:
      "Our AI assistant analyzes the diff (the changes in your files) and generates a conventional commit message that summarizes the changes, helping you maintain a clean and understandable project history.",
  },
  {
    question: "Is my GitHub account and data secure?",
    answer:
      "Absolutely. We use Supabase for secure GitHub OAuth, and we only request the permissions necessary to manage your repositories. Your credentials are never stored on our servers.",
  },
  {
    question: "Can I use GitAssist with private repositories?",
    answer:
      "Our 'Free Forever' plan supports public repositories. Support for private repositories is available on our upcoming Enterprise plan. Contact us for more details.",
  },
  {
    question: "What happens when I upload a ZIP file?",
    answer:
      "GitAssist automatically extracts the contents of your ZIP file, preserving the directory structure, and prepares them for committing to your selected GitHub repository. It's a seamless way to upload entire projects.",
  },
];


export const TEAM_MEMBERS: TeamMember[] = [
    {
      name: "Alex Devson",
      role: "Lead Developer",
      avatar: "team-member-1",
    },
    {
      name: "Jane Coder",
      role: "UX/UI Designer",
      avatar: "team-member-2",
    },
    {
      name: "Sam Opsfield",
      role: "DevOps Engineer",
      avatar: "team-member-3",
    },
  ];

export const FOOTER_LINKS = {
    "Product": [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Demo", href: "#demo" },
        { label: "Donate", href: "/donate" },
    ],
    "Company": [
        { label: "About Us", href: "#about" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
    ],
    "Support": [
        { label: "FAQ", href: "#faq" },
        { label: "Contact Us", href: "mailto:support@gitassist.com" },
        { label: "Status", href: "#" },
    ],
}
