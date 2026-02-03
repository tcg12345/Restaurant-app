import { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface OpeningHoursDisplayProps {
  hours: string[];
  className?: string;
}

export function OpeningHoursDisplay({ hours, className = "" }: OpeningHoursDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!hours || hours.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-gray-400" />
          <span className="text-gray-400">Hours not available</span>
        </div>
      </div>
    );
  }

  // Get current day
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const dayMap: { [key: string]: string } = {
    'sun': 'Sunday',
    'mon': 'Monday', 
    'tue': 'Tuesday',
    'wed': 'Wednesday',
    'thu': 'Thursday',
    'fri': 'Friday',
    'sat': 'Saturday'
  };

  // Parse and format the hours
  const formatHours = (hourString: string) => {
    const timeMatch = hourString.match(/:\s*(.+)/);
    if (timeMatch) {
      return timeMatch[1].trim();
    }
    return hourString;
  };

  const getDayName = (hourString: string) => {
    const dayMatch = hourString.match(/^([A-Za-z]+)/);
    return dayMatch ? dayMatch[1] : '';
  };

  // Find today's hours
  const todayHours = hours.find(hour => {
    const day = getDayName(hour).toLowerCase();
    return day.startsWith(currentDay);
  });

  const todayTime = todayHours ? formatHours(todayHours) : 'Closed';
  const isOpen = todayTime !== 'Closed' && !todayTime.toLowerCase().includes('closed');

  return (
    <div className={`${className}`}>
      {/* Header - Current Status */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-gray-800/30 transition-all duration-200 rounded-lg group"
      >
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
              isOpen 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {isOpen ? 'Open' : 'Closed'}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-300 font-medium">{todayTime}</span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 group-hover:text-white transition-all duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Hours List */}
      {isExpanded && (
        <div className="border-t border-gray-700/50 pt-3 mt-3">
          <div className="space-y-1">
            {hours.map((hour, index) => {
              const day = getDayName(hour);
              const time = formatHours(hour);
              const isToday = day.toLowerCase().startsWith(currentDay);
              
              return (
                <div 
                  key={index} 
                  className={`flex justify-between items-center py-2 px-3 rounded-lg transition-colors ${
                    isToday 
                      ? 'bg-blue-500/10 border border-blue-500/20' 
                      : 'hover:bg-gray-800/20'
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    isToday ? 'text-blue-400' : 'text-gray-300'
                  }`}>
                    {day}
                  </span>
                  <span className={`text-sm ${
                    isToday ? 'text-blue-400 font-medium' : 'text-gray-400'
                  }`}>
                    {time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}