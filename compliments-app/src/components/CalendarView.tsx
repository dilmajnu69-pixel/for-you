'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import PastelEmoji from './PastelEmoji';

interface SpecialDate {
  id: number;
  title: string;
  date: string;
  emoji: string;
}

interface CalendarViewProps {
  specialDates: SpecialDate[];
  onClose: () => void;
}

type ViewMode = 'year' | 'month';

export default function CalendarView({ specialDates, onClose }: CalendarViewProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create calendar grid - always 6 rows (42 cells) for consistent height
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  while (calendarDays.length < 42) {
    calendarDays.push(null);
  }

  // Check if a day has a special date (only if the date is not in the past)
  const getSpecialDateForDay = (day: number): SpecialDate | undefined => {
    const viewingDate = new Date(year, month, day);
    return specialDates.find(sd => {
      const sdDate = new Date(sd.date);
      const sdMonth = sdDate.getMonth();
      const sdDay = sdDate.getDate();
      // Only show if the original date is on or before the viewing date
      if (sdDate > viewingDate) return false;
      return sdMonth === month && sdDay === day;
    });
  };

  // Check if a month has special dates (only dates that are not in the future of calendar view)
  const getSpecialDatesForMonth = (monthIndex: number): SpecialDate[] => {
    const viewingMonthEnd = new Date(year, monthIndex + 1, 0); // Last day of viewing month
    return specialDates.filter(sd => {
      const sdDate = new Date(sd.date);
      // Only include if original date has already occurred (is on or before the viewing month)
      if (sdDate > viewingMonthEnd) return false;
      return sdDate.getMonth() === monthIndex;
    });
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToPrevYear = () => {
    setCurrentDate(new Date(year - 1, month, 1));
  };

  const goToNextYear = () => {
    setCurrentDate(new Date(year + 1, month, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const selectMonth = (monthIndex: number) => {
    setCurrentDate(new Date(year, monthIndex, 1));
    setViewMode('month');
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const isCurrentMonth = (monthIndex: number) =>
    today.getFullYear() === year && today.getMonth() === monthIndex;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 ${isDark ? 'bg-slate-900/80' : 'bg-black/50'} backdrop-blur-sm`} />

      {/* Calendar with external navigation */}
      <div className="relative z-10 flex items-center gap-4">
        {/* Left navigation button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (viewMode === 'year') {
              goToPrevYear();
            } else {
              goToPrevMonth();
            }
          }}
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 text-xl ${isDark
            ? 'bg-slate-800/90 hover:bg-pink-500/70 text-white border border-purple-500/30'
            : 'bg-white/90 hover:bg-pink-500 hover:text-white text-rose-600 border border-pink-200'
            } backdrop-blur-sm shadow-lg`}
          aria-label={viewMode === 'year' ? 'Previous year' : 'Previous month'}
        >
          ‹
        </button>

        {/* Calendar modal - fixed size */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-[380px] h-[520px] rounded-2xl p-6 shadow-2xl overflow-hidden flex flex-col ${isDark
            ? 'bg-gradient-to-br from-slate-800 via-purple-900/40 to-slate-800 border border-purple-500/30'
            : 'bg-white border border-pink-200'
            }`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 ${isDark ? 'hover:bg-purple-800/50 text-purple-300' : 'hover:bg-pink-100 text-rose-500'
              }`}
          >
            ✕
          </button>

          {/* Today button - top left */}
          <button
            onClick={goToToday}
            className={`absolute top-4 left-4 text-xs px-2 py-1 rounded transition-colors z-10 ${isDark ? 'bg-purple-800/50 text-purple-300 hover:bg-purple-700/50' : 'bg-pink-100 text-rose-500 hover:bg-pink-200'
              }`}
          >
            Today
          </button>

          {/* Header */}
          <div className="text-center mb-4 flex-shrink-0 pt-2">
            <button
              onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
              className={`text-xl font-bold transition-colors hover:opacity-80 ${isDark ? 'text-pink-300' : 'text-rose-700'}`}
            >
              {viewMode === 'month' ? `${monthNames[month]} ${year}` : year}
            </button>
            {/* Toggle switch */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                onClick={() => setViewMode('month')}
                className={`text-xs cursor-pointer transition-colors ${viewMode === 'month' ? (isDark ? 'text-pink-300 font-semibold' : 'text-rose-600 font-semibold') : (isDark ? 'text-purple-400' : 'text-pink-400')}`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
                className={`relative w-12 h-6 rounded-full cursor-pointer ${isDark ? 'bg-purple-700' : 'bg-pink-300'}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${viewMode === 'year' ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`text-xs cursor-pointer transition-colors ${viewMode === 'year' ? (isDark ? 'text-pink-300 font-semibold' : 'text-rose-600 font-semibold') : (isDark ? 'text-purple-400' : 'text-pink-400')}`}
              >
                Year
              </button>
            </div>
          </div>

          {viewMode === 'month' ? (
            <>
              {/* Day names header - fixed */}
              <div className="grid grid-cols-7 gap-1 mb-2 flex-shrink-0">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className={`text-center text-xs font-medium py-1 ${isDark ? 'text-purple-400' : 'text-pink-400'
                      }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 flex-shrink-0">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const specialDate = getSpecialDateForDay(day);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={day}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-all ${specialDate
                        ? isDark
                          ? 'bg-gradient-to-br from-pink-600/80 to-rose-600/80 text-white shadow-lg shadow-pink-500/30'
                          : 'bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-300'
                        : isTodayDate
                          ? isDark
                            ? 'bg-purple-700/50 text-pink-200 ring-2 ring-pink-400'
                            : 'bg-pink-100 text-rose-600 ring-2 ring-rose-400'
                          : isDark
                            ? 'hover:bg-purple-800/30 text-purple-200'
                            : 'hover:bg-pink-50 text-gray-700'
                        }`}
                      title={specialDate ? `${specialDate.emoji} ${specialDate.title}` : undefined}
                    >
                      <span className={`text-xs ${specialDate ? 'font-bold' : ''}`}>{day}</span>
                      {specialDate && (
                        <span className="text-[8px] mt-0.5" style={{ filter: 'saturate(0.7) brightness(1.1)' }}>
                          {specialDate.emoji}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend - scrollable */}
              <div className={`mt-4 pt-3 border-t flex-1 min-h-0 overflow-y-auto ${isDark ? 'border-purple-700/50' : 'border-pink-200'}`}>
                <p className={`text-xs ${isDark ? 'text-purple-400' : 'text-pink-400'} mb-2`}>
                  Special dates this month:
                </p>
                <div className="space-y-1">
                  {specialDates
                    .filter(sd => new Date(sd.date).getMonth() === month)
                    .map(sd => (
                      <div
                        key={sd.id}
                        className={`text-sm ${isDark ? 'text-pink-200' : 'text-rose-600'}`}
                      >
                        <PastelEmoji emoji={sd.emoji} size="sm" /> {sd.title} - {new Date(sd.date).getDate()}th
                      </div>
                    ))}
                  {specialDates.filter(sd => new Date(sd.date).getMonth() === month).length === 0 && (
                    <div className={`text-sm italic ${isDark ? 'text-purple-400' : 'text-pink-400'}`}>
                      No special dates this month
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Year View - Month Tiles */}
              <div className="grid grid-cols-3 gap-3 flex-1">
                {monthNamesShort.map((monthName, index) => {
                  const monthSpecialDates = getSpecialDatesForMonth(index);
                  const hasSpecialDates = monthSpecialDates.length > 0;
                  const isCurrent = isCurrentMonth(index);

                  return (
                    <button
                      key={monthName}
                      onClick={() => selectMonth(index)}
                      className={`rounded-xl p-3 flex flex-col items-center justify-center transition-all duration-300 ${hasSpecialDates
                        ? isDark
                          ? 'bg-gradient-to-br from-pink-600/60 to-rose-600/60 text-white shadow-lg shadow-pink-500/20 hover:from-pink-500/70 hover:to-rose-500/70'
                          : 'bg-gradient-to-br from-pink-300 to-rose-400 text-white shadow-lg shadow-pink-200 hover:from-pink-400 hover:to-rose-500'
                        : isCurrent
                          ? isDark
                            ? 'bg-purple-700/50 text-pink-200 ring-2 ring-pink-400'
                            : 'bg-pink-100 text-rose-600 ring-2 ring-rose-400'
                          : isDark
                            ? 'bg-purple-900/30 text-purple-200 hover:bg-purple-800/40'
                            : 'bg-pink-50 text-gray-700 hover:bg-pink-100'
                        }`}
                    >
                      <span className={`text-sm font-semibold ${hasSpecialDates ? 'text-white' : ''}`}>
                        {monthName}
                      </span>
                      {hasSpecialDates && (
                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                          {monthSpecialDates.slice(0, 3).map((sd, i) => (
                            <span key={i} className="text-[10px]" style={{ filter: 'saturate(0.7) brightness(1.1)' }}>
                              {sd.emoji}
                            </span>
                          ))}
                          {monthSpecialDates.length > 3 && (
                            <span className="text-[10px] opacity-70">+{monthSpecialDates.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Year view legend */}
              <div className={`mt-4 pt-3 border-t flex-shrink-0 ${isDark ? 'border-purple-700/50' : 'border-pink-200'}`}>
                <p className={`text-xs ${isDark ? 'text-purple-400' : 'text-pink-400'}`}>
                  Tap a month to view details • Highlighted months have special dates
                </p>
              </div>
            </>
          )}
        </motion.div>

        {/* Right navigation button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (viewMode === 'year') {
              goToNextYear();
            } else {
              goToNextMonth();
            }
          }}
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 text-xl ${isDark
            ? 'bg-slate-800/90 hover:bg-pink-500/70 text-white border border-purple-500/30'
            : 'bg-white/90 hover:bg-pink-500 hover:text-white text-rose-600 border border-pink-200'
            } backdrop-blur-sm shadow-lg`}
          aria-label={viewMode === 'year' ? 'Next year' : 'Next month'}
        >
          ›
        </button>
      </div>
    </motion.div>
  );
}
