import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import MarketingLayout from "@/app/(marketing)/layout";
import HomePage from "@/app/(marketing)/page";

test("the homepage provides a single main landmark and working in-page link targets", () => {
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
    "Dari ruang belajar ke kampus impian.",
  );
  expect(screen.getByRole("link", { name: "Kenali Evalio" })).toHaveAttribute(
    "href",
    "#tentang-evalio",
  );
  expect(screen.getByRole("region", { name: "Yang sedang disiapkan" })).toHaveAttribute(
    "id",
    "tentang-evalio",
  );
});
