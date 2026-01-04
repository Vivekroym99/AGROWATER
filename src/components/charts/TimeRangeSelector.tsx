'use client';

import { cn } from '@/lib/utils/cn';

type TimeRange = 7 | 30 | 90;

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  disabled?: boolean;
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: 7, label: '7 dni' },
  { value: 30, label: '30 dni' },
  { value: 90, label: '90 dni' },
];

export function TimeRangeSelector({
  value,
  onChange,
  disabled = false,
}: TimeRangeSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          disabled={disabled}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            value === range.value
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

export type { TimeRange };
