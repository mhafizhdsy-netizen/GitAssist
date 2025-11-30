
'use client';

import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function PrivacyPage() {
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
                    <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-4xl font-headline">Kebijakan Privasi</CardTitle>
                <CardDescription>
                    Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <article className="prose prose-invert mx-auto max-w-none">
                    <p className="lead">
                        Privasi Anda penting bagi kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat Anda menggunakan layanan GitAssist.
                    </p>
                    
                    <h2>1. Informasi yang Kami Kumpulkan</h2>
                    <p>
                        Saat Anda menggunakan GitAssist, kami dapat mengumpulkan informasi berikut:
                        <ul>
                        <li><strong>Informasi Akun:</strong> Kami menggunakan autentikasi GitHub. Kami menerima nama pengguna, alamat email, dan URL avatar GitHub Anda. Kami tidak menyimpan kata sandi GitHub Anda.</li>
                        <li><strong>Data Repositori:</strong> Kami mengakses sementara konten file dan struktur repositori untuk melakukan unggahan dan menghasilkan pesan commit. Data ini tidak disimpan dalam jangka panjang di server kami.</li>
                        <li><strong>Data Penggunaan:</strong> Kami dapat mengumpulkan data anonim tentang cara Anda berinteraksi dengan aplikasi kami untuk membantu kami meningkatkan layanan kami.</li>
                        </ul>
                    </p>
            
                    <h2>2. Bagaimana Kami Menggunakan Informasi Anda</h2>
                    <p>
                        Kami menggunakan informasi yang kami kumpulkan untuk:
                        <ul>
                        <li>Menyediakan, mengoperasikan, dan memelihara GitAssist.</li>
                        <li>Mengautentikasi akun GitHub Anda.</li>
                        <li>Memproses unggahan file ke repositori pilihan Anda.</li>
                        <li>Menghasilkan pesan commit yang didukung AI.</li>
                        <li>Berkomunikasi dengan Anda, termasuk untuk layanan pelanggan dan dukungan.</li>
                        </ul>
                    </p>
            
                    <h2>3. Keamanan Data</h2>
                    <p>
                        Kami menerapkan berbagai langkah keamanan untuk menjaga keamanan informasi pribadi Anda. Semua komunikasi dienkripsi menggunakan teknologi SSL, dan akses ke data Anda sangat dibatasi. Token akses GitHub disimpan sementara di sisi klien (`sessionStorage`) dan tidak pernah dikirim ke server kami, kecuali untuk berinteraksi langsung dengan API GitHub atas nama Anda.
                    </p>
            
                    <h2>4. Layanan Pihak Ketiga</h2>
                    <p>
                        Kami menggunakan layanan pihak ketiga seperti Firebase untuk autentikasi dan Gemini dari Google untuk fitur AI. Layanan ini memiliki kebijakan privasi mereka sendiri, yang kami sarankan untuk Anda tinjau.
                    </p>
            
                    <h2>5. Perubahan pada Kebijakan Ini</h2>
                    <p>
                        Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberitahu Anda tentang perubahan apa pun dengan memposting Kebijakan Privasi baru di halaman ini.
                    </p>
            
                    <h2>6. Hubungi Kami</h2>
                    <p>
                        Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di <a href="mailto:mhafizhdsy@gmail.com">mhafizhdsy@gmail.com</a>.
                    </p>
                </article>
            </CardContent>
        </Card>
      </motion.div>
    );
  }
