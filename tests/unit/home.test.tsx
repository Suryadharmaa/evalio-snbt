import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import MarketingLayout from "@/app/(marketing)/layout";
import HomePage from "@/app/(marketing)/page";

test("the landing page presents available preview links and a historical subtest list", () => {
  render(
    <MarketingLayout>
      <HomePage />
    </MarketingLayout>,
  );

  expect(screen.getByRole("main")).toHaveAttribute("id", "konten-utama");
  expect(screen.getByRole("link", { name: "Lewati ke konten utama" })).toHaveAttribute(
    "href",
    "#konten-utama",
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Belajar UTBK lebih terarah. Pilih PTN lebih terencana.",
  );

  const diagnosticLinks = screen.getAllByRole("link", { name: "Coba Diagnostik Gratis" });
  expect(diagnosticLinks).toHaveLength(2);
  for (const link of diagnosticLinks) {
    expect(link).toHaveAttribute("href", "#diagnostik");
    expect(link).toHaveAccessibleDescription(/Segera hadir/);
  }

  const preview = screen.getByRole("region", { name: "Seperti apa belajar di Evalio?" });
  expect(within(preview).getAllByText("Ilustrasi · Segera hadir")).toHaveLength(3);

  const subtests = screen.getByRole("region", { name: "Tujuh subtes SNBT" });
  expect(within(subtests).getAllByRole("listitem")).toHaveLength(7);
  expect(subtests).toHaveTextContent(/SNBT 2026.*SNBT 2027 masih menunggu konfirmasi resmi/);
});
