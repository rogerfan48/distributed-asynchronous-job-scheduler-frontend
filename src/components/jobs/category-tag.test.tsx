import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryTag } from "./category-tag";

describe("CategoryTag", () => {
  it("renders the trimmed category name", () => {
    render(<CategoryTag category="  data  " />);
    expect(screen.getByText("data")).toBeInTheDocument();
  });

  it("renders nothing for empty / whitespace / null", () => {
    const { container: a } = render(<CategoryTag category={null} />);
    expect(a.firstChild).toBeNull();
    const { container: b } = render(<CategoryTag category="   " />);
    expect(b.firstChild).toBeNull();
  });

  it("assigns the same colour to the same name and a palette colour overall", () => {
    // Contract: category colours are a deterministic frontend hash (同名同色),
    // so grouped views stay visually stable without backend support.
    const a = render(<CategoryTag category="reports" />).container.firstElementChild!.className;
    const b = render(<CategoryTag category="reports" />).container.firstElementChild!.className;
    expect(a).toBe(b);
    expect(a).toMatch(/bg-(sky|violet|emerald|amber|rose|cyan|fuchsia|lime)-500\/15/);
  });
});
