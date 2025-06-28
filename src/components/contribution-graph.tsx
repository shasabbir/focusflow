"use client";

import React from 'react';
import { subMonths, eachDayOfInterval, format, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ContributionData } from '@/lib/pomodoro';

interface ContributionGraphProps {
  data: ContributionData;
}

const getContributionLevel = (minutes: number | undefined): number => {
  if (!minutes || minutes <= 0) return 0;
  if (minutes < 25) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
};

const levelColors = [
  'bg-muted/50',
  'bg-accent/30',
  'bg-accent/50',
  'bg-accent/70',
  'bg-accent',
];

export function ContributionGraph({ data }: ContributionGraphProps) {
  const endDate = new Date();
  const startDate = subMonths(endDate, 6);
  
  const weekStartsOn = 1; // Monday
  const firstDay = startOfWeek(startDate, { weekStartsOn });
  const lastDay = endOfWeek(endDate, { weekStartsOn });

  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  const weekDays = ["Mon", "Wed", "Fri"];

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex justify-center p-4 rounded-lg">
        <div className="flex gap-2">
            <div className="flex flex-col justify-between text-xs text-muted-foreground mr-1">
                {weekDays.map(day => <span key={day} className='mt-2'>{day}</span>)}
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-1">
            {days.map((day) => {
                const dateString = format(day, 'yyyy-MM-dd');
                const minutes = data[dateString] || 0;
                const level = getContributionLevel(minutes);
                const isFuture = day > endDate;

                return (
                <Tooltip key={dateString}>
                    <TooltipTrigger asChild>
                    <div
                        className={cn(
                        'h-3.5 w-3.5 rounded-sm',
                        isFuture ? 'bg-transparent' : levelColors[level]
                        )}
                    />
                    </TooltipTrigger>
                    {!isFuture && (
                        <TooltipContent>
                            <p className="text-sm font-medium">
                            {minutes > 0 ? `${minutes} minutes` : 'No contributions'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                            on {format(day, 'EEEE, MMMM d, yyyy')}
                            </p>
                        </TooltipContent>
                    )}
                </Tooltip>
                );
            })}
            </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
