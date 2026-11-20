import { AccountPanel, accountLink } from "@/features/account/account-panel";

export default function PrivacyPage() {
  return (
    <AccountPanel title="Privasi akun uji" description="Pemberitahuan privasi Evalio · Versi 1">
      <div className="space-y-4 text-sm/7 text-ink">
        <p>Evalio menggunakan email untuk masuk, konfirmasi akun, dan pemulihan kata sandi. Kami menyimpan tahun target UTBK, waktu pembuatan akun, dan catatan bahwa kamu telah membaca pemberitahuan ini.</p>
        <p>Nama panggilan dan tujuan belajar bersifat opsional. Gunakan data sintetis dan hindari nama lengkap, sekolah, tanggal lahir, nomor telepon, alamat, atau informasi sensitif lain.</p>
        <h2 className="text-base font-bold">Akun pelajar</h2>
        <p>Pendaftaran akun pelajar belum dibuka. Sebelum menerima pelajar di bawah 18 tahun, Evalio akan meninjau perlindungan yang sesuai dan proses persetujuan orang tua atau wali jika diwajibkan.</p>
        <h2 className="text-base font-bold">Salinan dan penghapusan data</h2>
        <p>Dari halaman profil, kamu dapat mengunduh salinan data akun dan meminta penghapusan. Pengelola memproses permintaan tersebut. Akun tetap bisa diakses selama permintaan menunggu pemrosesan.</p>
      </div>
      <a href="/profile" className={`${accountLink} text-sm`}>Buka profil</a>
    </AccountPanel>
  );
}
