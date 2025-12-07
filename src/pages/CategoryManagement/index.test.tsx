import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";

import CategoryManagement from "./index";
import userEvent from "@testing-library/user-event";

// Mock API functions
const mockGetCategories = vi.fn();
const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();
const mockDeleteCategory = vi.fn();

vi.mock("../../api/categories", () => ({
  getCategories: () => mockGetCategories(),
  createCategory: (name: string) => mockCreateCategory(name),
  updateCategory: (id: string, name: string) => mockUpdateCategory(id, name),
  deleteCategory: (id: string) => mockDeleteCategory(id),
}));

// Mock CustomerContext
vi.mock("../../context/CustomerContext", () => ({
  useCustomer: () => ({
    profile: { customerId: "test-customer-id" },
  }),
}));

describe("CategoryManagement Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  const renderWithClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it("renders the component with title", () => {
    mockGetCategories.mockResolvedValue([]);

    renderWithClient(<CategoryManagement />);

    expect(screen.getByText(/Manage Categories/i)).toBeInTheDocument();
    expect(screen.getByText(/Add New Category/i)).toBeInTheDocument();
  });

  it("displays loading state when fetching categories", async () => {
    mockGetCategories.mockImplementation(() => new Promise(() => {}));

    renderWithClient(<CategoryManagement />);

    await waitFor(() => {
      expect(screen.getByText(/Loading categories.../i)).toBeInTheDocument();
    });
  });

  it("displays error state when fetching fails", async () => {
    mockGetCategories.mockRejectedValue(new Error("Failed to fetch"));

    renderWithClient(<CategoryManagement />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load categories/i)
      ).toBeInTheDocument();
    });
  });

  it("displays categories list", async () => {
    const mockCategories = [
      { id: "1", name: "Health" },
      { id: "2", name: "Education" },
    ];
    mockGetCategories.mockResolvedValue(mockCategories);

    renderWithClient(<CategoryManagement />);

    await waitFor(() => {
      expect(screen.getByText("Health")).toBeInTheDocument();
      expect(screen.getByText("Education")).toBeInTheDocument();
    });
  });

  it("displays empty state when no categories", async () => {
    mockGetCategories.mockResolvedValue([]);

    renderWithClient(<CategoryManagement />);

    await waitFor(() => {
      expect(screen.getByText(/No categories yet/i)).toBeInTheDocument();
    });
  });

  it("creates a new category", async () => {
    const user = userEvent.setup();
    mockGetCategories.mockResolvedValue([]);
    mockCreateCategory.mockResolvedValue({ id: "3", name: "Life" });

    renderWithClient(<CategoryManagement />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Category name/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Category name/i);
    const addButton = screen.getByRole("button", { name: /Add/i });

    await user.type(input, "Life");
    await user.click(addButton);

    expect(mockCreateCategory).toHaveBeenCalledWith("Life");
  });

  it("disables add button when input is empty", async () => {
    mockGetCategories.mockResolvedValue([]);

    renderWithClient(<CategoryManagement />);

    await waitFor(() => {
      const addButton = screen.getByRole("button", { name: /Add/i });
      expect(addButton).toBeDisabled();
    });
  });

  it("enters edit mode when pencil icon is clicked", async () => {
    const user = userEvent.setup();
    const mockCategories = [{ id: "1", name: "Health" }];
    mockGetCategories.mockResolvedValue(mockCategories);

    renderWithClient(<CategoryManagement />);

    await waitFor(() => {
      expect(screen.getByText("Health")).toBeInTheDocument();
    });

    const editButton = screen.getByTitle("Edit");
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Health")).toBeInTheDocument();
    });
  });

  it("updates category name", async () => {
    const user = userEvent.setup();
    const mockCategories = [{ id: "1", name: "Health" }];
    mockGetCategories.mockResolvedValue(mockCategories);
    mockUpdateCategory.mockResolvedValue({ id: "1", name: "Wellness" });

    renderWithClient(<CategoryManagement />);

    await waitFor(() => {
      expect(screen.getByText("Health")).toBeInTheDocument();
    });

    const editButton = screen.getByTitle("Edit");
    await user.click(editButton);

    const input = await screen.findByDisplayValue("Health");
    await user.clear(input);
    await user.type(input, "Wellness");

    const saveButton = screen.getByTitle("Save");
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith("1", "Wellness");
    });
  });

  it("cancels edit mode when X icon is clicked", async () => {
    const user = userEvent.setup();
    const mockCategories = [{ id: "1", name: "Health" }];
    mockGetCategories.mockResolvedValue(mockCategories);

    renderWithClient(<CategoryManagement />);

    await waitFor(() => {
      expect(screen.getByText("Health")).toBeInTheDocument();
    });

    const editButton = screen.getByTitle("Edit");
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Health")).toBeInTheDocument();
    });

    const cancelButton = screen.getByTitle("Cancel");
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByDisplayValue("Health")).not.toBeInTheDocument();
      expect(screen.getByText("Health")).toBeInTheDocument();
    });
  });

  it("deletes category after confirmation", async () => {
    const user = userEvent.setup();
    const mockCategories = [{ id: "1", name: "Health" }];
    mockGetCategories.mockResolvedValue(mockCategories);
    mockDeleteCategory.mockResolvedValue({ success: true });
    window.confirm = vi.fn(() => true);

    renderWithClient(<CategoryManagement />);

    await waitFor(() => {
      expect(screen.getByText("Health")).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle(
      "Delete (will delete all goals in this category)"
    );
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith("1");
    });
  });

  it("does not delete when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const mockCategories = [{ id: "1", name: "Health" }];
    mockGetCategories.mockResolvedValue(mockCategories);
    window.confirm = vi.fn(() => false);

    renderWithClient(<CategoryManagement />);

    await waitFor(() => {
      expect(screen.getByText("Health")).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle(
      "Delete (will delete all goals in this category)"
    );
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteCategory).not.toHaveBeenCalled();
  });
});
