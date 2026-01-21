'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskResponse } from '@/lib/validations';
import { CheckCircle2, Circle, Trash2, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
  task: TaskResponse & {
    user?: { id: string; name: string; email: string };
    workspace?: { id: string; name: string } | null;
  };
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onToggleStatus, onDelete }: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(task.id);
    setIsDeleting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const tags = Array.isArray(task.tags) ? task.tags : (task.tags ? [task.tags] : []);

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={() => onToggleStatus(task.id)}
              className="mt-1 transition-transform hover:scale-110"
              aria-label={`Mark task as ${task.status === 'COMPLETED' ? 'pending' : 'completed'}`}
            >
              {task.status === 'COMPLETED' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold text-lg ${
                  task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''
                }`}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={getStatusColor(task.status)}>
            {task.status.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
          {task.category && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
              {task.category}
            </Badge>
          )}
          {task.metadata && (
            <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Enriched
            </Badge>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
