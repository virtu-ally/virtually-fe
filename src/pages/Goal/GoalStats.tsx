const GoalStats = ({
  completionCount,
  completionRate,
  goalCount,
}: {
  completionCount: number;
  completionRate: number;
  goalCount: number;
}) => {
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  );
};

export default GoalStats;
