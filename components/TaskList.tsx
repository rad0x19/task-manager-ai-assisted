'use client';

import { TaskResponse, TaskStatus } from '@/lib/validations';
import { TaskCard } from './TaskCard';
import { Skeleton } from '@/components/ui/skeleton';

interface TaskListProps {
  tasks: TaskResponse[];
  isLoading?: boolean;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  filter?: TaskStatus;
}

export function TaskList({
  tasks,
  isLoading,
  onToggleStatus,
  onDelete,
  filter,
}: TaskListProps) {
  const filteredTasks = filter
    ? tasks.filter((task) => task.status === filter)
    : tasks;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return null; // EmptyState will be handled by parent
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
