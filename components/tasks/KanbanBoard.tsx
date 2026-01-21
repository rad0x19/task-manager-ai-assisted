'use client';

import { TaskResponse, TaskStatus } from '@/lib/validations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';

interface KanbanBoardProps {
  tasks: TaskResponse[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'PENDING', title: 'Pending' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'COMPLETED', title: 'Completed' },
];

export function KanbanBoard({ tasks, onToggleStatus, onDelete }: KanbanBoardProps) {
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      onToggleStatus(taskId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.id);
        return (
          <div key={column.id} className="flex flex-col">
            <h3 className="font-semibold text-lg mb-4 px-2">
              {column.title} ({columnTasks.length})
            </h3>
            <div className="flex-1 min-h-[200px] p-2 rounded-lg bg-gray-50 space-y-2">
              {columnTasks.map((task) => (
                <Card key={task.id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="font-semibold">{task.title}</div>
                  {task.description && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {task.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(task.id, column.id === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
                    >
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(task.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
              {columnTasks.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No tasks in this column
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
