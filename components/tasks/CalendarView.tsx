'use client';

import { TaskResponse } from '@/lib/validations';
import { Card } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface CalendarViewProps {
  tasks: TaskResponse[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CalendarView({ tasks, onToggleStatus, onDelete }: CalendarViewProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDay = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), date);
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-2xl font-bold">
        {format(today, 'MMMM yyyy')}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 p-2">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, today);
          return (
            <Card
              key={day.toISOString()}
              className={`p-2 min-h-[100px] ${
                isToday ? 'border-2 border-primary' : ''
              }`}
            >
              <div
                className={`text-sm font-semibold mb-1 ${
                  isToday ? 'text-primary' : ''
                }`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="text-xs p-1 bg-blue-100 rounded truncate cursor-pointer hover:bg-blue-200"
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
