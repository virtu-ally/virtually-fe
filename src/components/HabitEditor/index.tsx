import "./index.css";

import { PencilLine, Plus } from "lucide-react";

import { XIcon } from "lucide-react";
import { useState } from "react";

interface HabitEditorProps {
  habits: string[];
  onHabitsChange: (habits: string[]) => void;
  disabled?: boolean;
  className?: string;
}

const HabitEditor = ({
  habits,
  onHabitsChange,
  disabled = false,
  className = "",
}: HabitEditorProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleTaskChange = (index: number, value: string) => {
    const newHabits = [...habits];
    newHabits[index] = value;
    onHabitsChange(newHabits);
  };

  const handleTaskEdit = (index: number) => {
    if (!disabled) {
      setEditingIndex(index);
    }
  };

  const handleTaskSave = (index: number) => {
    setEditingIndex(null);
  };

  const handleRemoveTask = (index: number) => {
    const newHabits = habits.filter((_, i) => i !== index);
    onHabitsChange(newHabits);
  };

  const handleAddTask = () => {
    onHabitsChange([...habits, ""]);
  };

  return (
    <div className={`habit-editor ${className}`}>
      {habits.map((habit, index) => (
        <div key={index} className="mb-4 task-container">
          {editingIndex === index ? (
            <div className="flex gap-2 w-full">
              <textarea
                rows={2}
                className="w-full border-b border-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)] pb-2 bg-transparent md:min-h-[36px] min-h-[120px]"
                name={`habit-${index}`}
                placeholder="Enter your habit"
                value={habit}
                onChange={(e) => handleTaskChange(index, e.target.value)}
                onBlur={() => handleTaskSave(index)}
                autoFocus
              />
              <button
                onClick={() => handleTaskSave(index)}
                className="text-[var(--btn-color)] hover:text-[var(--accent-color)]"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                aria-label="Edit habit"
                onClick={() => handleTaskEdit(index)}
                className="text-[var(--btn-color)] hover:text-[var(--accent-color)]"
                disabled={disabled}
              >
                <PencilLine size={16} />
              </button>
              <p
                className="task w-full border-b border-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)] pb-2 bg-transparent cursor-pointer"
                onClick={() => handleTaskEdit(index)}
              >
                {habit || "Enter your habit"}
              </p>
              <div className="flex gap-1">
                <button
                  aria-label="Remove habit"
                  onClick={() => handleRemoveTask(index)}
                  className="text-[var(--btn-color)] hover:text-[var(--accent-color)]"
                  disabled={disabled}
                >
                  <XIcon className="minus cursor-pointer" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={handleAddTask}
        disabled={disabled}
        className="text-[var(--btn-color)] text-2xl font-bold cursor-pointer"
      >
        <Plus className="hover:stroke-[var(--accent-color)] plus" />
      </button>
    </div>
  );
};

export default HabitEditor;
