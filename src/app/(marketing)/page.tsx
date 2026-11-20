import styles from "./home.module.css";

export default function HomePage() {
  return (
    <>
      <section
        aria-labelledby="judul-utama"
        className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[1.15fr_1fr] md:items-center lg:gap-16 lg:py-20"
      >
        <div>
          <p className="mb-5 text-sm font-semibold text-primary-hover">Persiapan UTBK-SNBT 2027</p>
          <h1 id="judul-utama" className="max-w-2xl font-display text-5xl/[1.04] tracking-tight sm:text-6xl/[1.04] lg:text-7xl/[1.04]">
            Dari ruang belajar ke <em className="text-primary-hover">kampus impian.</em>
          </h1>
          <p className="mt-6 max-w-md text-base/7 text-muted sm:text-lg/8">
            Evalio sedang menyiapkan tempat untuk berlatih UTBK-SNBT dan merencanakan pilihan program studi di perguruan tinggi negeri.
          </p>
          <a href="#tentang-evalio" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-panel bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
            Kenali Evalio <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div aria-hidden="true" className={styles.illustration}>
          <div className={styles.arch} />
          <div className={styles.sun} />
          <div className={styles.steps} />
        </div>
      </section>

      <section id="tentang-evalio" tabIndex={-1} aria-labelledby="judul-tentang" className="scroll-mt-4 border-t border-line bg-lavender">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
          <h2 id="judul-tentang" className="font-display text-3xl tracking-tight sm:text-4xl">Yang sedang disiapkan</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            <li className="rounded-panel border border-line bg-surface p-5 sm:p-6">
              <h3 className="font-semibold">Latihan UTBK-SNBT</h3>
              <p className="mt-2 text-sm/6 text-muted">Latihan soal dengan pembahasan untuk membantu menentukan materi yang perlu dipelajari lagi.</p>
            </li>
            <li className="rounded-panel border border-line bg-surface p-5 sm:p-6">
              <h3 className="font-semibold">Eksplorasi PTN</h3>
              <p className="mt-2 text-sm/6 text-muted">Informasi program studi dengan sumber dan tahun rujukan untuk membantu menyusun daftar pilihan.</p>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
