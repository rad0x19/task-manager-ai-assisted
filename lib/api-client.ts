import { TaskResponse, CreateTaskInput, UpdateTaskInput, TaskStatus } from './validations';

const API_BASE = '/api/tasks';

export async function fetchTasks(status?: TaskStatus, workspaceId?: string): Promise<TaskResponse[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (workspaceId) params.set('workspaceId', workspaceId);
  const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
}

export async function createTask(data: CreateTaskInput): Promise<TaskResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create task');
  }
  return response.json();
}

export async function updateTask(
  id: string,
  data: UpdateTaskInput
): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update task');
  }
  return response.json();
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
}
