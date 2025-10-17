import { Calendar } from "lucide-react";
import { useState } from "react";

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
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl z-50 p-4 min-w-[300px]">
            <div className="flex items-center justify-between mb-3">
              <button
                className="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
                }}
              >
                Prev
              </button>
              <div className="font-semibold text-sm">
                {currentMonth.toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <button
                className="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
                }}
              >
                Next
              </button>
            </div>

            <div className="mb-2 text-center">
              <button
                className="px-3 py-1 text-sm border rounded bg-blue-50 hover:bg-blue-100"
                onClick={(e) => {
                  e.stopPropagation();
                  const today = new Date();
                  setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedDate(today);
                  setShowDatePicker(false);
                }}
              >
                Today
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1 opacity-70">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                const startWeekday = firstDay.getDay();
                const today = new Date();
                const selectedDay = selectedDate.getDate();
                const selectedMonthMatches =
                  selectedDate.getFullYear() === currentMonth.getFullYear() &&
                  selectedDate.getMonth() === currentMonth.getMonth();

                return (
                  <>
                    {Array.from({ length: startWeekday }).map((_, i) => (
                      <div key={`pad-${i}`} className="h-8" />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const dayNum = i + 1;
                      const isSelectedDay = selectedMonthMatches && selectedDay === dayNum;
                      const isToday =
                        today.getFullYear() === currentMonth.getFullYear() &&
                        today.getMonth() === currentMonth.getMonth() &&
                        today.getDate() === dayNum;

                      return (
                        <button
                          key={dayNum}
                          onClick={(e) => {
                            e.stopPropagation();
                            const d = new Date(currentMonth);
                            d.setDate(dayNum);
                            setSelectedDate(d);
                            setShowDatePicker(false);
                          }}
                          className={`h-8 rounded border text-xs flex items-center justify-center transition-colors ${
                            isSelectedDay
                              ? "bg-blue-500 text-white border-blue-600"
                              : isToday
                              ? "border-2 border-blue-400 bg-blue-50"
                              : "border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalStats;
