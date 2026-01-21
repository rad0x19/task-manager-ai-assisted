import { User, Workspace, Task } from '@prisma/client';

export function canAccessAdmin(user: User) {
  return user.role === 'ADMIN';
}

export function canManageWorkspace(
  user: User,
  workspace: Workspace & { members?: Array<{ userId: string; role: string }> }
) {
  if (user.role === 'ADMIN') return true;
  if (workspace.ownerId === user.id) return true;
  const member = workspace.members?.find((m) => m.userId === user.id);
  return member?.role === 'OWNER' || member?.role === 'ADMIN';
}

export function canEditTask(
  user: User,
  task: Task & { workspace?: Workspace & { members?: Array<{ userId: string; role: string }> } | null }
) {
  if (task.userId === user.id) return true;
  if (task.workspace) {
    return canManageWorkspace(user, task.workspace);
  }
  return false;
}

export function canViewTask(
  user: User,
  task: Task & { workspace?: Workspace & { members?: Array<{ userId: string; role: string }> } | null }
) {
  if (task.userId === user.id) return true;
  if (task.workspace) {
    const member = task.workspace.members?.find((m) => m.userId === user.id);
    return !!member || task.workspace.ownerId === user.id;
  }
  return false;
}
