import { Calendar } from "lucide-react";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

const GoalStats = ({
  completionCount,
  completionRate,
  goalCount,
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
}: {
  completionCount: number;
  completionRate: number;
  goalCount: number;
  currentMonth: Date;
  setCurrentMonth: (date: Date | ((prev: Date) => Date)) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/70 text-[var(--secondary-text-color)] rounded p-4">
        <h4 className="font-semibold text-lg">{completionCount}</h4>
        <p className="text-sm opacity-80">Completions This Month</p>
      </div>
      <div className="bg-white/70 text-[var(--secondary-text-color)] rounded p-4">
        <h4 className="font-semibold text-lg">{completionRate.toFixed(1)}%</h4>
        <p className="text-sm opacity-80">Monthly Completion Rate</p>
      </div>
      <div className="bg-white/70 text-[var(--secondary-text-color)] rounded p-4">
        <h4 className="font-semibold text-lg">{goalCount}</h4>
        <p className="text-sm opacity-80">Active Goals</p>
      </div>
      <div className="bg-white/70 text-[var(--secondary-text-color)] rounded p-4 relative">
        <button
          className="w-full h-full text-left"
          onClick={() => setShowDatePicker(!showDatePicker)}
        >
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            <div>
              <h4 className="font-semibold text-lg">History</h4>
              <p className="text-sm opacity-80">{selectedDate.toLocaleDateString()}</p>
            </div>
          </div>
        </button>

        {showDatePicker && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl z-50 p-4">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setShowDatePicker(false);
                }
              }}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              disabled={{ after: new Date() }}
              hidden={{ after: new Date() }}
              endMonth={new Date()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalStats;
