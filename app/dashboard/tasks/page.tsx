'use client';

import { useEffect, useState } from 'react';
import { TaskList } from '@/components/TaskList';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { CalendarView } from '@/components/tasks/CalendarView';
import { TableView } from '@/components/tasks/TableView';
import { TaskForm } from '@/components/TaskForm';
import { TaskResponse, TaskStatus, CreateTaskInput } from '@/lib/validations';
import { fetchTasks, createTask, updateTask, deleteTask } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Plus, List, LayoutGrid, Calendar, Table } from 'lucide-react';

type ViewMode = 'list' | 'kanban' | 'calendar' | 'table';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await fetchTasks(filter);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (data: CreateTaskInput) => {
    try {
      const newTask = await createTask(data);
      setTasks((prev) => [newTask, ...prev]);
      setTimeout(() => {
        loadTasks();
      }, 2000);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const handleToggleStatus = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus: TaskStatus =
      task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
      await updateTask(id, { status: newStatus });
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      loadTasks();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await deleteTask(id);
    } catch (error) {
      console.error('Error deleting task:', error);
      loadTasks();
    }
  };

  const filteredTasks = filter
    ? tasks.filter((task) => task.status === filter)
    : tasks;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tasks</h2>
          <p className="text-gray-600 mt-1">Manage your tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsFormOpen(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === undefined ? 'default' : 'outline'}
          onClick={() => setFilter(undefined)}
          size="sm"
        >
          All ({tasks.length})
        </Button>
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          onClick={() => setFilter('PENDING')}
          size="sm"
        >
          Pending ({tasks.filter((t) => t.status === 'PENDING').length})
        </Button>
        <Button
          variant={filter === 'IN_PROGRESS' ? 'default' : 'outline'}
          onClick={() => setFilter('IN_PROGRESS')}
          size="sm"
        >
          In Progress ({tasks.filter((t) => t.status === 'IN_PROGRESS').length})
        </Button>
        <Button
          variant={filter === 'COMPLETED' ? 'default' : 'outline'}
          onClick={() => setFilter('COMPLETED')}
          size="sm"
        >
          Completed ({tasks.filter((t) => t.status === 'COMPLETED').length})
        </Button>
      </div>

      {isLoading && tasks.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          filter={filter}
        />
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      ) : viewMode === 'calendar' ? (
        <CalendarView
          tasks={filteredTasks}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      ) : (
        <TableView
          tasks={filteredTasks}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      )}

      <TaskForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}
