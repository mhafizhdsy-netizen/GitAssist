
import { type LucideIcon, Sparkles, UploadCloud, GitBranch, Zap, FileArchive, ShieldCheck, AlertCircle, Rocket } from "lucide-react";
import type { NavItem, FAQItem, FeatureCard } from "@/lib/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Fitur", href: "/features" },
  { label: "Cara Kerja", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Donasi", href: "https://saweria.co/Antraxxx" },
];

export const FEATURES: FeatureCard[] = [
  {
    icon: Zap,
    title: "Commit File Cepat",
    description: "Unggah banyak file dan folder sekaligus. Ekstrak arsip .zip secara otomatis untuk mempercepat proses.",
    color: "purple",
  },
  {
    icon: Sparkles,
    title: "Pesan Commit AI",
    description: "Biarkan AI kami membuat pesan commit yang cerdas dan konvensional hanya dari daftar file yang Anda ubah.",
    color: "green",
  },
  {
    icon: AlertCircle,
    title: "Manajemen Issues",
    description: "Buat, lihat, dan kelola GitHub Issues langsung dari dasbor Anda, dengan bantuan AI untuk menyempurnakan deskripsi.",
    color: "yellow",
  },
  {
    icon: Rocket,
    title: "Publikasi Rilis",
    description: "Publikasikan rilis baru dengan mudah, lampirkan aset biner, dan gunakan AI untuk menulis catatan rilis yang jelas.",
    color: "pink",
  },
  {
    icon: GitBranch,
    title: "Manajemen Branch",
    description: "Pilih branch tujuan atau buat branch baru dengan mudah langsung dari antarmuka sebelum melakukan commit.",
    color: "blue",
  },
  {
    icon: ShieldCheck,
    title: "Autentikasi Aman",
    description: "Data Anda aman. Kami menggunakan GitHub OAuth yang aman dan token Anda hanya disimpan di sisi klien.",
    color: "indigo",
  },
];


export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Apakah GitAssist gratis untuk digunakan?",
    answer:
      "Ya, GitAssist sepenuhnya gratis untuk digunakan. Ini adalah proyek sumber terbuka yang dirancang untuk membantu para pengembang.",
  },
  {
    question: "Bagaimana cara kerja pembuatan pesan commit AI?",
    answer:
      "Asisten AI kami menganalisis perubahan pada file Anda (git diff) dan secara otomatis menghasilkan pesan commit yang deskriptif dan sesuai dengan standar Conventional Commits, membantu Anda menjaga riwayat proyek yang bersih.",
  },
    {
    question: "Bisakah saya mengelola GitHub Issues dan Releases?",
    answer:
      "Tentu saja. Anda dapat membuat Issues baru dan mempublikasikan Releases langsung dari dasbor GitAssist. Kami bahkan menyediakan bantuan AI untuk menyempurnakan deskripsi Issues dan catatan rilis Anda agar lebih profesional.",
  },
  {
    question: "Apakah akun dan data GitHub saya aman?",
    answer:
      "Sangat aman. Kami menggunakan alur GitHub OAuth standar industri. Token akses Anda disimpan dengan aman di penyimpanan lokal browser Anda dan tidak pernah dikirim atau disimpan di server kami, memastikan Anda memiliki kontrol penuh.",
  },
  {
    question: "Apa yang terjadi ketika saya mengunggah file ZIP?",
    answer:
      "GitAssist dapat secara otomatis mengekstrak konten file .zip Anda, mempertahankan struktur direktori aslinya, dan menyiapkannya untuk di-commit ke repositori GitHub pilihan Anda. Fitur ini dapat diaktifkan atau dinonaktifkan sesuai kebutuhan.",
  },
    {
    question: "Dapatkah saya menggunakan GitAssist untuk repositori pribadi?",
    answer:
      "Ya, saat Anda mengautentikasi dengan GitHub, Anda memberikan izin 'repo' yang memungkinkan GitAssist untuk mengakses dan mengelola baik repositori publik maupun pribadi Anda.",
  },
];

export const FOOTER_LINKS = {
    "Produk": [
        { label: "Fitur", href: "/features" },
        { label: "Cara Kerja", href: "/how-it-works" },
        { label: "Donasi", href: "https://saweria.co/Antraxxx" },
    ],
    "Perusahaan": [
        { label: "Kebijakan Privasi", href: "/privacy" },
        { label: "Ketentuan Layanan", href: "/terms" },
    ],
    "Dukungan": [
        { label: "FAQ", href: "/faq" },
        { label: "Hubungi Kami", href: "mailto:mhafizhdsy@gmail.com" },
    ],
};
