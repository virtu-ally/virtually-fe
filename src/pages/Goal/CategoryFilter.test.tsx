import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../../test/test-utils";

import CategoryFilter from "./CategoryFilter";
import userEvent from "@testing-library/user-event";

describe("CategoryFilter Component", () => {
  const mockCategories = [
    { id: "1", name: "Health" },
    { id: "2", name: "Education" },
    { id: "3", name: "Life" },
  ];

  it("renders loading state", () => {
    render(
      <CategoryFilter
        categories={[]}
        isLoading={true}
        selectedCategoryId={null}
        onCategorySelect={vi.fn()}
      />
    );

    expect(screen.getByText(/Loading categories.../i)).toBeInTheDocument();
  });

  it("renders all category buttons", () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        isLoading={false}
        selectedCategoryId={null}
        onCategorySelect={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Health" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Education" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Life" })).toBeInTheDocument();
  });

  it("highlights selected category", () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        isLoading={false}
        selectedCategoryId="2"
        onCategorySelect={vi.fn()}
      />
    );

    const educationButton = screen.getByRole("button", { name: "Education" });
    expect(educationButton).toHaveClass("bg-[var(--btn-color)]");
    expect(educationButton).toHaveClass("text-white");
  });

  it("calls onCategorySelect when category button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnCategorySelect = vi.fn();

    render(
      <CategoryFilter
        categories={mockCategories}
        isLoading={false}
        selectedCategoryId={null}
        onCategorySelect={mockOnCategorySelect}
      />
    );

    const healthButton = screen.getByRole("button", { name: "Health" });
    await user.click(healthButton);

    expect(mockOnCategorySelect).toHaveBeenCalledWith("1");
  });

  it("renders empty when no categories and not loading", () => {
    const { container } = render(
      <CategoryFilter
        categories={[]}
        isLoading={false}
        selectedCategoryId={null}
        onCategorySelect={vi.fn()}
      />
    );

    // Should render the container but with no buttons
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });

  it("applies correct styles to non-selected categories", () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        isLoading={false}
        selectedCategoryId="1"
        onCategorySelect={vi.fn()}
      />
    );

    const educationButton = screen.getByRole("button", { name: "Education" });
    expect(educationButton).toHaveClass("bg-white/70");
    expect(educationButton).toHaveClass("text-[var(--secondary-text-color)]");
  });
});
