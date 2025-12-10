'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
}

export function DateRangePicker({ startDate, endDate, onDateChange }: DateRangePickerProps) {
  const { t } = useLanguage();
  const [showCustom, setShowCustom] = useState(false);

  const presets = [
    { label: t.last7Days || 'Last 7 days', days: 7 },
    { label: t.last30Days || 'Last 30 days', days: 30 },
    { label: t.last90Days || 'Last 90 days', days: 90 },
    { label: t.thisMonth || 'This month', value: 'thisMonth' },
    { label: t.lastMonth || 'Last month', value: 'lastMonth' },
    { label: t.thisYear || 'This year', value: 'thisYear' },
  ];

  const handlePresetClick = (preset: any) => {
    const end = new Date();
    let start = new Date();

    if (preset.days) {
      start.setDate(end.getDate() - preset.days);
    } else if (preset.value === 'thisMonth') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (preset.value === 'lastMonth') {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end.setDate(0); // Last day of previous month
    } else if (preset.value === 'thisYear') {
      start = new Date(end.getFullYear(), 0, 1);
    }

    onDateChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    setShowCustom(false);
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <Calendar className="w-5 h-5 text-gray-400" />
      <span className="text-sm text-gray-600 dark:text-gray-400">{t.dateRange || 'Date Range'}:</span>
      
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          {t.custom || 'Custom'}
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateChange(e.target.value, endDate)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateChange(startDate, e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
        </div>
      )}
    </div>
  );
}
