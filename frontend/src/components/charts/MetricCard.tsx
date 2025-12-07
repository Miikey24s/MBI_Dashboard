'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn, formatVND, formatNumber, formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'currency' | 'number' | 'percent';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  className?: string;
}

export function MetricCard({
  title,
  value,
  previousValue,
  format = 'currency',
  icon,
  trend,
  trendValue,
  className,
}: MetricCardProps) {
  const formattedValue = format === 'currency' 
    ? formatVND(value) 
    : format === 'percent' 
      ? `${value.toFixed(1)}%`
      : formatNumber(value);

  // Tính trend nếu có previousValue
  const calculatedTrend = trend ?? (previousValue !== undefined 
    ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral'
    : undefined);

  const calculatedTrendValue = trendValue ?? (previousValue !== undefined && previousValue > 0
    ? ((value - previousValue) / previousValue) * 100
    : undefined);

  const TrendIcon = calculatedTrend === 'up' 
    ? TrendingUp 
    : calculatedTrend === 'down' 
      ? TrendingDown 
      : Minus;

  const trendColor = calculatedTrend === 'up' 
    ? 'text-green-600 dark:text-green-400' 
    : calculatedTrend === 'down' 
      ? 'text-red-600 dark:text-red-400' 
      : 'text-gray-500';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formattedValue}
            </p>
            {calculatedTrend && calculatedTrendValue !== undefined && (
              <div className={cn('mt-2 flex items-center gap-1 text-sm', trendColor)}>
                <TrendIcon className="h-4 w-4" />
                <span>{formatPercent(calculatedTrendValue)}</span>
                <span className="text-gray-500 dark:text-gray-400">so với tháng trước</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
