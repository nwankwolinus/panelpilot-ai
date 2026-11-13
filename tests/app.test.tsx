import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HomePage from "@/app/page";

describe("PanelPilot AI Foundation", () => {
  it("renders the platform title and subtitle", () => {
    render(<HomePage />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("PanelPilot AI");

    const subtitle = screen.getByText("LV Electrical Panel Engineering and Quotation Platform");
    expect(subtitle).toBeInTheDocument();
  });

  it("displays the architecture foundation status badge", () => {
    render(<HomePage />);

    const statusBadge = screen.getByText(/architecture foundation/i);
    expect(statusBadge).toBeInTheDocument();
  });
});
