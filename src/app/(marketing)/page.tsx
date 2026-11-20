import { DiagnosticLink, LandingSection, SectionHeading } from "@/components/marketing/landing-sections";
import { ProductPreviews } from "@/components/marketing/product-previews";
import styles from "./home.module.css";

const benefits = [
  ["Tujuh subtes UTBK", "Siapkan latihan lintas subtes, dari penalaran hingga literasi."],
  ["Pembahasan yang jelas", "Pahami langkah penyelesaian dan alasan di balik jawaban."],
  ["Progres latihan dan tryout", "Tinjau hasil dari waktu ke waktu untuk menentukan fokus belajar."],
  ["Informasi PTN dengan sumber", "Bandingkan program studi dengan melihat sumber dan tahun rujukannya."],
];

const steps = [
  ["Mulai dari latihan", "Gunakan diagnostik singkat untuk menentukan titik awal belajar."],
  ["Pahami hasilnya", "Baca pembahasan dan lihat topik yang masih perlu perhatian."],
  ["Latih topik yang sulit", "Ulangi topik yang belum kamu kuasai, lalu tinjau perkembanganmu."],
  ["Eksplorasi program studi", "Susun daftar pilihan dan periksa sumber informasi tiap program."],
];

const subtests = [
  {
    group: "Tes Potensi Skolastik",
    names: [
      "Penalaran Umum",
      "Pengetahuan dan Pemahaman Umum",
      "Pemahaman Bacaan dan Menulis",
      "Pengetahuan Kuantitatif",
    ],
  },
  {
    group: "Tes Literasi",
    names: [
      "Literasi dalam Bahasa Indonesia",
      "Literasi dalam Bahasa Inggris",
      "Penalaran Matematika",
    ],
  },
];

const plans = [
  {
    name: "Gratis",
    status: "Rencana",
    description: "Mulai belajar dengan diagnostik singkat dan pilihan latihan dasar.",
  },
  {
    name: "Premium",
    status: "Direncanakan",
    description: "Akses lebih luas ke latihan, tryout, dan riwayat progres belajar.",
  },
];

const questions = [
  ["Apa itu Evalio?", "Evalio sedang dikembangkan untuk membantu siswa Indonesia berlatih UTBK-SNBT dan merencanakan pilihan program studi di perguruan tinggi negeri (PTN)."],
  ["Apakah Evalio berafiliasi dengan SNPMB?", "Evalio adalah platform independen tanpa afiliasi dengan SNPMB atau perguruan tinggi negeri."],
  ["Apakah Evalio gratis?", "Diagnostik singkat dan latihan dasar direncanakan tersedia dalam paket Gratis. Cakupan dan harga paket Premium masih dalam peninjauan."],
  ["Kapan fitur belajar tersedia?", "Segera hadir. Fitur belajar masih dikembangkan dan tanggal peluncuran belum ditetapkan. Kamu sudah bisa melihat ilustrasi alur belajar di halaman ini."],
];

export default function HomePage() {
  return (
    <>
      <section aria-labelledby="judul-utama" className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-9 px-5 py-11 sm:px-8 sm:py-16 md:grid-cols-[1.17fr_1fr] md:items-center lg:gap-14 lg:py-[4.5rem]">
          <div className="min-w-0">
            <p className="mb-5 text-xs font-bold tracking-[0.14em] text-primary-hover uppercase">
              Persiapan UTBK-SNBT 2027
            </p>
            <h1 id="judul-utama" className="font-display text-[clamp(2.5rem,5.3vw,4.35rem)] leading-[1.02] tracking-[-0.05em]">
              <span className="block text-balance">Belajar UTBK lebih terarah.</span>{" "}
              <span className="block text-primary-hover text-balance">Pilih PTN <em>lebih terencana.</em></span>
            </h1>
            <p className="mt-5 max-w-md text-base/7 text-muted sm:text-lg/8">
              Siapkan UTBK dengan pembahasan yang mudah diikuti, lalu susun pilihan program studi berdasarkan sumber yang jelas.
            </p>
            <p id="ketersediaan-hero" className="mt-6 max-w-md text-sm/6 text-muted">
              <strong className="text-ink">Segera hadir.</strong> Diagnostik dan PTN Explorer sedang disiapkan. Lihat ilustrasinya.
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <DiagnosticLink />
              <a
                href="#ptn"
                aria-describedby="ketersediaan-hero"
                className="inline-flex min-h-12 items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink hover:bg-lavender"
              >
                Jelajahi PTN
                <span aria-hidden="true" className="size-2 -translate-y-0.5 rotate-45 border-r border-b" />
              </a>
            </div>
          </div>
          <div aria-hidden="true" className={styles.illustration}>
            <div className={styles.frame} />
            <div className={styles.arch} />
            <div className={styles.sun} />
            <div className={styles.steps} />
            <div className={styles.book} />
          </div>
        </div>
      </section>

      <LandingSection id="manfaat">
        <SectionHeading id="manfaat" title="Belajar dan memilih dengan bekal yang jelas" />
        <ul role="list" className="mt-7 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([title, description]) => (
            <li key={title} className="border-t border-line pt-4">
              <h3 className="text-base/6 font-bold">{title}</h3>
              <p className="mt-2 text-sm/6 text-muted">{description}</p>
            </li>
          ))}
        </ul>
      </LandingSection>

      <LandingSection id="cara-kerja" tone="lavender">
        <SectionHeading id="cara-kerja" title="Cara kerja Evalio" />
        <ol role="list" className="mt-7 grid gap-x-7 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, description], index) => (
            <li key={title} className="grid grid-cols-[auto_1fr] items-start gap-3 lg:block">
              <span aria-hidden="true" className="grid size-9 place-items-center rounded-full border border-line bg-surface text-sm font-bold text-primary-hover">
                {index + 1}
              </span>
              <div className="lg:mt-4">
                <h3 className="text-base/6 font-bold">{title}</h3>
                <p className="mt-1.5 text-sm/6 text-muted">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </LandingSection>

      <ProductPreviews />

      <LandingSection id="subtes" tone="paper">
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <SectionHeading
              id="subtes"
              title="Tujuh subtes SNBT"
              description="Daftar ini merujuk pada SNBT 2026. Ketentuan SNBT 2027 masih menunggu konfirmasi resmi."
            />
            <a
              href="https://snpmb.id/utbk-snbt/informasi-umum"
              className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-hover underline underline-offset-4 hover:text-ink"
            >
              Informasi resmi SNPMB
              <span aria-hidden="true" className={styles.externalArrow} />
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {subtests.map(({ group, names }) => (
              <div key={group} className="rounded-panel border border-line bg-surface p-5">
                <h3 className="text-base font-bold">{group}</h3>
                <ul role="list" className="mt-2 divide-y divide-line">
                  {names.map((name) => (
                    <li key={name} className="py-2 text-sm/6 text-muted">{name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </LandingSection>

      <LandingSection id="paket">
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <SectionHeading
            id="paket"
            title="Rencana paket belajar"
            description="Kami menyiapkan akses awal gratis. Cakupan dan harga Premium masih dalam peninjauan. Pembelian belum tersedia."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map(({ name, status, description }) => (
              <article key={name} className="rounded-panel border border-line bg-lavender p-5">
                <p className="text-xs font-bold text-primary-hover">{status}</p>
                <h3 className="mt-2 font-display text-3xl tracking-tight">{name}</h3>
                <p className="mt-2 text-sm/6 text-muted">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </LandingSection>

      <LandingSection id="faq" tone="paper">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <SectionHeading id="faq" title="Pertanyaan umum" />
          <div className="divide-y divide-line rounded-panel border border-line bg-surface px-4 sm:px-5">
            {questions.map(([question, answer]) => (
              <details key={question} className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm/6 font-bold hover:text-primary-hover [&::-webkit-details-marker]:hidden">
                  {question}
                  <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-lavender text-primary-hover">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:block">−</span>
                  </span>
                </summary>
                <p className="pb-4 text-sm/6 text-muted">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </LandingSection>

      <LandingSection id="mulai">
        <div className="grid items-center gap-6 rounded-2xl bg-ink px-5 py-8 text-white sm:px-9 sm:py-10 md:grid-cols-[1fr_auto]">
          <div>
            <h2 id="mulai-judul" className="font-display text-[2.15rem]/[1.08] tracking-tight text-balance sm:text-5xl/[1.08]">
              Kenali cara belajarnya
            </h2>
            <p id="ketersediaan-akhir" className="mt-3 max-w-xl text-sm/6 text-lavender sm:text-base/7">
              <strong>Segera hadir.</strong> Sambil menunggu diagnostik dibuka, lihat ilustrasi latihan dan pembahasannya.
            </p>
          </div>
          <DiagnosticLink light />
        </div>
      </LandingSection>
    </>
  );
}
