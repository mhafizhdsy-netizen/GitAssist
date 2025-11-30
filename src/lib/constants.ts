
import { type LucideIcon, Sparkles, UploadCloud, GitBranch, Zap, FileArchive, ShieldCheck } from "lucide-react";
import type { NavItem, FAQItem, FeatureCard } from "@/lib/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Fitur", href: "/#features" },
  { label: "Cara Kerja", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
];

export const FEATURES: FeatureCard[] = [
  {
    icon: Zap,
    title: "Unggahan Massal",
    description: "Unggah banyak file sekaligus, meningkatkan efisiensi unggahan.",
    color: "purple",
  },
  {
    icon: FileArchive,
    title: "Ekstraksi ZIP",
    description: "Ekstrak file ZIP secara otomatis dan unggah isinya ke repositori.",
    color: "blue",
  },
  {
    icon: Sparkles,
    title: "Pesan Commit AI",
    description: "Biarkan AI kami membuat pesan commit yang cerdas dan konvensional dari diff Anda.",
    color: "green",
  },
  {
    icon: GitBranch,
    title: "Pilih Repo Setelah Unggah",
    description: "Pilih repositori setelah mengunggah file atau setelah ekstraksi ZIP berhasil.",
    color: "pink",
  },
  {
    icon: ShieldCheck,
    title: "Autentikasi Aman",
    description: "Data Anda aman bersama kami. Kami menggunakan GitHub OAuth yang aman untuk autentikasi.",
    color: "yellow",
  },
  {
    icon: UploadCloud,
    title: "Unggahan Mulus",
    description: "Antarmuka pengguna yang jelas dan intuitif untuk proses unggahan yang lancar.",
    color: "indigo",
  },
];


export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Apakah GitAssist gratis untuk digunakan?",
    answer:
      "Ya, GitAssist menawarkan paket gratis yang mencakup semua fitur inti untuk repositori publik. Kami percaya dalam menyediakan alat yang kuat untuk komunitas pengembang.",
  },
  {
    question: "Bagaimana cara kerja pembuatan pesan commit AI?",
    answer:
      "Asisten AI kami menganalisis diff (perubahan dalam file Anda) dan menghasilkan pesan commit konvensional yang merangkum perubahan, membantu Anda menjaga riwayat proyek yang bersih dan mudah dipahami.",
  },
  {
    question: "Apakah akun dan data GitHub saya aman?",
    answer:
      "Tentu saja. Kami menggunakan GitHub OAuth yang aman, dan kami hanya meminta izin yang diperlukan untuk mengelola repositori Anda. Kredensial Anda tidak pernah disimpan di server kami.",
  },
  {
    question: "Bisakah saya menggunakan GitAssist dengan repositori pribadi?",
    answer:
      "Dukungan untuk repositori pribadi adalah fitur yang direncanakan untuk penawaran premium di masa mendatang. Untuk saat ini, layanan ini difokuskan pada repositori publik.",
  },
  {
    question: "Apa yang terjadi ketika saya mengunggah file ZIP?",
    answer:
      "GitAssist secara otomatis mengekstrak konten file ZIP Anda, mempertahankan struktur direktori, dan menyiapkannya untuk di-commit ke repositori GitHub pilihan Anda. Ini adalah cara yang mulus untuk mengunggah seluruh proyek.",
  },
];

export const FOOTER_LINKS = {
    "Produk": [
        { label: "Fitur", href: "/#features" },
        { label: "Cara Kerja", href: "/#how-it-works" },
        { label: "Donasi", href: "https://saweria.co/Antraxxx" },
    ],
    "Perusahaan": [
        { label: "Kebijakan Privasi", href: "/privacy" },
        { label: "Ketentuan Layanan", href: "/terms" },
    ],
    "Dukungan": [
        { label: "FAQ", href: "/#faq" },
        { label: "Hubungi Kami", href: "mailto:mhafizhdsy@gmail.com" },
    ],
}
