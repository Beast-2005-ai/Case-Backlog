interface PriorityGaugeProps {
  score: number;
}

export function PriorityGauge({ score }: PriorityGaugeProps) {
  const getColor = (score: number) => {
    if (score >= 80) return '#ef4444'; // Red-500
    if (score >= 60) return '#eab308'; // Yellow-500
    return '#22c55e'; // Green-500
  };

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-12 h-12">
      <svg className="transform -rotate-90 w-12 h-12">
        <circle cx="24" cy="24" r="18" stroke="#2a2a2a" strokeWidth="3" fill="none" />
        <circle
          cx="24" cy="24" r="18"
          stroke={getColor(score)}
          strokeWidth="3" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-gray-200 font-medium text-[11px]">{score.toFixed(2)}</span>
      </div>
    </div>
  );
}