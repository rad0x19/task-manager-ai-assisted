'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskList } from '@/components/TaskList';
import { TaskForm } from '@/components/TaskForm';
import { EmptyState } from '@/components/EmptyState';
import { TaskResponse, TaskStatus, CreateTaskInput } from '@/lib/validations';
import { fetchTasks, createTask, updateTask, deleteTask } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | undefined>(undefined);
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

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'PENDING').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Overview of your tasks and productivity</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          New Task
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === undefined ? 'default' : 'outline'}
          onClick={() => setFilter(undefined)}
          size="sm"
        >
          All ({stats.total})
        </Button>
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          onClick={() => setFilter('PENDING')}
          size="sm"
        >
          Pending ({stats.pending})
        </Button>
        <Button
          variant={filter === 'IN_PROGRESS' ? 'default' : 'outline'}
          onClick={() => setFilter('IN_PROGRESS')}
          size="sm"
        >
          In Progress ({stats.inProgress})
        </Button>
        <Button
          variant={filter === 'COMPLETED' ? 'default' : 'outline'}
          onClick={() => setFilter('COMPLETED')}
          size="sm"
        >
          Completed ({stats.completed})
        </Button>
      </div>

      {isLoading && tasks.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState />
      ) : (
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          filter={filter}
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
