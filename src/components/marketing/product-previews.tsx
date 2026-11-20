import { LandingSection, PreviewCard, SectionHeading } from "./landing-sections";

export function ProductPreviews() {
  return (
    <LandingSection id="cuplikan">
      <SectionHeading
        id="cuplikan"
        title="Seperti apa belajar di Evalio?"
        description="Lihat ilustrasi latihan, rangkuman hasil, dan daftar pilihan program studi."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <PreviewCard
          id="diagnostik"
          title="Latihan & diagnostik"
          description="Diagnostik singkat dirancang untuk membantu menemukan topik yang perlu kamu pelajari lebih dulu."
        >
          <p className="text-xs font-semibold text-primary-hover">Penalaran Matematika</p>
          <p className="mt-2 text-sm/6 font-semibold">Jika 3 buku berharga Rp24.000, berapa harga 5 buku dengan harga satuan yang sama?</p>
          <p className="mt-3 rounded-md border border-line bg-lavender px-2.5 py-2 text-xs/5 text-ink">
            <strong>Pembahasan</strong> · Satu buku Rp8.000, jadi 5 buku Rp40.000.
          </p>
        </PreviewCard>
        <PreviewCard
          id="progres"
          title="Ringkasan progres"
          description="Tinjau hasil latihan dan tryout, lalu pilih topik yang perlu dilatih kembali."
        >
          <p className="text-xs font-semibold text-primary-hover">Contoh hasil latihan</p>
          <dl className="mt-3 grid grid-cols-3 gap-1.5 text-center">
            {[
              { label: "Benar", value: 6 },
              { label: "Salah", value: 3 },
              { label: "Kosong", value: 1 },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md border border-line bg-surface px-1 py-2">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs/5 text-muted"><strong>Latih lagi</strong> · Rasio dan perbandingan</p>
        </PreviewCard>
        <PreviewCard
          id="ptn"
          title="Perencana pilihan PTN"
          description="Jelajahi program studi dan bandingkan pilihan dengan informasi yang menyertakan sumber dan tahun rujukan."
        >
          <p className="text-xs font-semibold text-primary-hover">Contoh daftar pilihan</p>
          <ol role="list" className="mt-3 space-y-2">
            {["Teknik Lingkungan", "Statistika"].map((program) => (
              <li key={program} className="rounded-md border border-line bg-surface px-2.5 py-2 text-sm font-semibold">{program}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs/5 text-muted">Rujukan yang akan ditampilkan · Sumber dan tahun</p>
        </PreviewCard>
      </div>
    </LandingSection>
  );
}
