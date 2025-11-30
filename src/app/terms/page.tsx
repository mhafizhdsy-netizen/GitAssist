
'use client';

import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function TermsPage() {
    return (
      <motion.div 
        className="container py-24 sm:py-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="max-w-4xl mx-auto glass-card">
            <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-4xl font-headline">Ketentuan Layanan</CardTitle>
                <CardDescription>
                    Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <article className="prose prose-invert mx-auto max-w-none">
                    <p className="lead">
                        Selamat datang di GitAssist. Dengan mengakses atau menggunakan layanan kami, Anda menyetujui untuk terikat oleh ketentuan ini. Harap baca dengan seksama.
                    </p>
            
                    <h2>1. Penggunaan Layanan Kami</h2>
                    <p>
                        Anda harus mengikuti kebijakan apa pun yang tersedia untuk Anda dalam Layanan. Anda hanya dapat menggunakan Layanan kami sebagaimana diizinkan oleh hukum. Kami dapat menangguhkan atau menghentikan penyediaan Layanan kami kepada Anda jika Anda tidak mematuhi ketentuan atau kebijakan kami atau jika kami sedang menyelidiki dugaan pelanggaran.
                    </p>
            
                    <h2>2. Akun GitAssist Anda</h2>
                    <p>
                        Anda memerlukan akun GitHub untuk menggunakan Layanan kami. Anda bertanggung jawab untuk menjaga keamanan akun Anda. Anda juga bertanggung jawab atas aktivitas yang terjadi melalui akun Anda. Kami tidak dapat dan tidak akan bertanggung jawab atas kehilangan atau kerusakan apa pun yang timbul dari kegagalan Anda untuk mematuhi hal di atas.
                    </p>
            
                    <h2>3. Konten dan Perilaku</h2>
                    <p>
                        Anda bertanggung jawab penuh atas perilaku Anda dan konten yang Anda unggah ke GitHub melalui Layanan kami. Kami tidak bertanggung jawab atas konten yang diposting di Layanan. Anda setuju untuk tidak menyalahgunakan Layanan atau membantu orang lain melakukannya.
                    </p>
            
                    <h2>4. Fitur AI</h2>
                    <p>
                        Konten yang dihasilkan oleh kecerdasan buatan (misalnya, pesan commit) disediakan "sebagaimana adanya" tanpa jaminan apa pun. Anda bertanggung jawab untuk meninjau, memvalidasi, dan menyetujui konten yang dihasilkan AI sebelum menggunakannya dalam commit Anda.
                    </p>
            
                    <h2>5. Penafian dan Batasan Tanggung Jawab</h2>
                    <p>
                        Layanan ini disediakan "sebagaimana adanya." Sejauh diizinkan oleh hukum, kami menafikan semua jaminan, tersurat maupun tersirat, sehubungan dengan Layanan dan penggunaan Anda atasnya. Kami tidak akan bertanggung jawab atas kerugian tidak langsung, insidental, khusus, konsekuensial, atau hukuman, atau kehilangan keuntungan atau pendapatan apa pun.
                    </p>
            
                    <h2>6. Perubahan pada Ketentuan Ini</h2>
                    <p>
                        Kami dapat mengubah ketentuan ini atau ketentuan tambahan apa pun yang berlaku untuk Layanan untuk, misalnya, mencerminkan perubahan hukum atau perubahan pada Layanan kami. Anda harus melihat ketentuan secara teratur.
                    </p>
            
                    <h2>7. Hubungi Kami</h2>
                    <p>
                        Jika Anda memiliki pertanyaan tentang Ketentuan ini, silakan hubungi kami di <a href="mailto:mhafizhdsy@gmail.com">mhafizhdsy@gmail.com</a>.
                    </p>
                </article>
            </CardContent>
        </Card>
      </motion.div>
    );
  }
