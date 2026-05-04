"use client";

interface ScoreRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export function ScoreRing({
  value,
  size = 64,
  strokeWidth = 6,
  showLabel = true,
}: ScoreRingProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;
  
  const color = clampedValue >= 50 ? "#dc2626" : clampedValue >= 20 ? "#f59e0b" : "#16a34a";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="font-bold text-sm"
          style={{ color }}
        >
          {clampedValue.toFixed(0)}
        </span>
        {showLabel && (
          <span className="text-[8px] text-gray-500">%</span>
        )}
      </div>
    </div>
  );
}