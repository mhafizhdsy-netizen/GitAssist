import { type LucideIcon, Sparkles, UploadCloud, GitBranch, Zap, FileArchive, ShieldCheck } from "lucide-react";
import type { NavItem, FAQItem, FeatureCard } from "@/lib/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
  { label: "Donate", href: "/donate" },
];

export const FEATURES: FeatureCard[] = [
  {
    icon: Zap,
    title: "Batch Upload",
    description: "Upload multiple files at once, improving upload efficiency.",
    color: "purple",
  },
  {
    icon: FileArchive,
    title: "ZIP Extraction",
    description: "Automatically extract ZIP files and upload their contents to the repository.",
    color: "blue",
  },
  {
    icon: Sparkles,
    title: "AI Commit Messages",
    description: "Let our AI generate smart and conventional commit messages from your diffs.",
    color: "green",
  },
  {
    icon: GitBranch,
    title: "Post-Upload Repo Selection",
    description: "Select a repository after uploading a file or after successful ZIP extraction.",
    color: "pink",
  },
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    description: "Your data is safe with us. We use secure GitHub OAuth for authentication.",
    color: "yellow",
  },
  {
    icon: UploadCloud,
    title: "Seamless Uploads",
    description: "A clear and intuitive user interface for a smooth upload process.",
    color: "indigo",
  },
];


export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Is GitAssist free to use?",
    answer:
      "Yes, GitAssist offers a generous free plan that includes all core features for public repositories. We believe in providing powerful tools to the developer community.",
  },
  {
    question: "How does the AI commit message generation work?",
    answer:
      "Our AI assistant analyzes the diff (the changes in your files) and generates a conventional commit message that summarizes the changes, helping you maintain a clean and understandable project history.",
  },
  {
    question: "Is my GitHub account and data secure?",
    answer:
      "Absolutely. We use secure GitHub OAuth, and we only request the permissions necessary to manage your repositories. Your credentials are never stored on our servers.",
  },
  {
    question: "Can I use GitAssist with private repositories?",
    answer:
      "Support for private repositories is a planned feature for a future premium offering. For now, the service is focused on public repositories.",
  },
  {
    question: "What happens when I upload a ZIP file?",
    answer:
      "GitAssist automatically extracts the contents of your ZIP file, preserving the directory structure, and prepares them for committing to your selected GitHub repository. It's a seamless way to upload entire projects.",
  },
];

export const FOOTER_LINKS = {
    "Product": [
        { label: "Features", href: "/#features" },
        { label: "How It Works", href: "/#how-it-works" },
        { label: "Donate", href: "/donate" },
    ],
    "Company": [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
    ],
    "Support": [
        { label: "FAQ", href: "/#faq" },
        { label: "Contact Us", href: "mailto:support@gitassist.com" },
    ],
}
