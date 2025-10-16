type Category = {
  id: string;
  name: string;
};

const CategoryFilter = ({
  categories,
  isLoading,
  selectedCategoryId,
  onCategorySelect,
}: {
  categories: Category[];
  isLoading: boolean;
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
}) => {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {isLoading && (
          <span className="px-4 py-2 text-sm opacity-70">
            Loading categories...
          </span>
        )}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`px-4 py-2 rounded whitespace-nowrap ${
              selectedCategoryId === category.id
                ? "bg-[var(--btn-color)] text-white"
                : "bg-white/70 text-[var(--secondary-text-color)] hover:bg-white/90"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
