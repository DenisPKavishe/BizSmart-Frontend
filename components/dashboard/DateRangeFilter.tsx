// components/dashboard/DateRangeFilter.tsx
'use client';

import { useState } from 'react';
import { FiCalendar, FiChevronDown } from 'react-icons/fi';

interface DateRangeFilterProps {
  onRangeChange: (range: string, startDate?: string, endDate?: string) => void;
}

export function DateRangeFilter({ onRangeChange }: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState('30d');
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const ranges = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'This year', value: 'year' },
    { label: 'Custom', value: 'custom' },
  ];

  const handleRangeClick = (range: string) => {
    setSelectedRange(range);
    if (range === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onRangeChange(range);
    }
  };

  const handleApplyCustom = () => {
    if (startDate && endDate) {
      onRangeChange('custom', startDate, endDate);
      setShowCustom(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => handleRangeClick(range.value)}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              selectedRange === range.value && range.value !== 'custom'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10 min-w-[300px]">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleApplyCustom}
                className="flex-1 bg-brand-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-brand-600 transition"
              >
                Apply
              </button>
              <button
                onClick={() => setShowCustom(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}