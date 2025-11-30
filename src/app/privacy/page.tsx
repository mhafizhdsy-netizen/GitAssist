
export default function PrivacyPage() {
    return (
      <div className="container py-24 sm:py-32">
        <article className="prose prose-invert mx-auto max-w-3xl">
          <h1 className="font-headline text-4xl">Kebijakan Privasi</h1>
          <p className="lead">
            Privasi Anda penting bagi kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda.
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
            Kami menerapkan berbagai langkah keamanan untuk menjaga keamanan informasi pribadi Anda. Semua komunikasi dienkripsi menggunakan teknologi SSL, dan akses ke data Anda sangat dibatasi.
          </p>
  
          <h2>4. Layanan Pihak Ketiga</h2>
          <p>
            Kami menggunakan layanan pihak ketiga seperti Firebase untuk autentikasi dan manajemen database, serta Gemini dari Google untuk fitur AI. Layanan ini memiliki kebijakan privasi mereka sendiri, yang kami sarankan untuk Anda tinjau.
          </p>
  
          <h2>5. Perubahan pada Kebijakan Ini</h2>
          <p>
            Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberitahu Anda tentang perubahan apa pun dengan memposting Kebijakan Privasi baru di halaman ini.
          </p>
  
          <h2>6. Hubungi Kami</h2>
          <p>
            Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di <a href="mailto:mhafizhdsy@gmail.com">mhafizhdsy@gmail.com</a>.
          </p>
          <p><small>Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</small></p>
        </article>
      </div>
    );
  }

