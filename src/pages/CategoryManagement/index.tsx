import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "../../api/categories";
import { useCustomer } from "../../context/CustomerContext";
import { Loader, Plus, Pencil, Trash2, X, Check } from "lucide-react";

const CategoryManagement = () => {
  const { profile } = useCustomer();
  const customerId = profile?.customerId;
  const queryClient = useQueryClient();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null
  );

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", customerId] });
      setNewCategoryName("");
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", customerId] });
      setEditingCategoryId(null);
      setEditingCategoryName("");
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", customerId] });
      setDeletingCategoryId(null);
    },
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      createMutation.mutate(newCategoryName.trim());
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleSaveEdit = (categoryId: string) => {
    if (editingCategoryName.trim()) {
      updateMutation.mutate({
        id: categoryId,
        name: editingCategoryName.trim(),
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (
      window.confirm(
        "Are you sure? This will delete all goals in this category!"
      )
    ) {
      deleteMutation.mutate(categoryId);
    }
  };

  const categories = categoriesQuery.data || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-color)]">
        Manage Categories
      </h1>

      {/* Add New Category Form */}
      <div className="bg-white/80 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--secondary-text-color)]">
          Add New Category
        </h2>
        <form onSubmit={handleCreateCategory} className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className="flex-1 border-b border-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)] pb-2 bg-transparent text-[var(--secondary-text-color)]"
            disabled={createMutation.isPending}
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !newCategoryName.trim()}
            className="bg-[var(--btn-color)] text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader className="animate-spin" size={16} />
                Adding...
              </>
            ) : (
              <>
                <Plus size={16} />
                Add
              </>
            )}
          </button>
        </form>
        {createMutation.isError && (
          <p className="text-red-500 text-sm mt-2">
            Failed to create category. Please try again.
          </p>
        )}
      </div>

      {/* Category List */}
      <div className="bg-white/80 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--secondary-text-color)]">
          Your Categories
        </h2>

        {categoriesQuery.isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin" size={24} />
            <span className="ml-2">Loading categories...</span>
          </div>
        )}

        {categoriesQuery.isError && (
          <div className="text-red-500 py-4">
            Failed to load categories. Please try again.
          </div>
        )}

        {!categoriesQuery.isLoading && categories.length === 0 && (
          <div className="text-center py-8 text-[var(--secondary-text-color)] opacity-70">
            No categories yet. Create your first category above!
          </div>
        )}

        <ul className="space-y-3">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between p-3 rounded bg-white/50 hover:bg-white/70 transition-colors"
            >
              {editingCategoryId === category.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    className="flex-1 border-b border-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)] pb-1 bg-transparent text-[var(--secondary-text-color)]"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(category.id)}
                    disabled={updateMutation.isPending}
                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                    title="Save"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={updateMutation.isPending}
                    className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    title="Cancel"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-[var(--secondary-text-color)]">
                    {category.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(category)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={
                        deleteMutation.isPending &&
                        deletingCategoryId === category.id
                      }
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      title="Delete (will delete all goals in this category)"
                    >
                      {deleteMutation.isPending &&
                      deletingCategoryId === category.id ? (
                        <Loader className="animate-spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        {updateMutation.isError && (
          <p className="text-red-500 text-sm mt-2">
            Failed to update category. Please try again.
          </p>
        )}
        {deleteMutation.isError && (
          <p className="text-red-500 text-sm mt-2">
            Failed to delete category. Please try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;
