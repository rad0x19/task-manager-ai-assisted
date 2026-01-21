import { Workspace, Task, UserRole } from '@prisma/client';

type UserForPermissions = {
  id: string;
  role: UserRole | string;
};

export function canAccessAdmin(user: UserForPermissions) {
  return user.role === 'ADMIN';
}

export function canManageWorkspace(
  user: UserForPermissions,
  workspace: Workspace & { members?: Array<{ userId: string; role: string }> }
) {
  if (user.role === 'ADMIN') return true;
  if (workspace.ownerId === user.id) return true;
  const member = workspace.members?.find((m) => m.userId === user.id);
  return member?.role === 'OWNER' || member?.role === 'ADMIN';
}

export function canEditTask(
  user: UserForPermissions,
  task: Task & { workspace?: Workspace & { members?: Array<{ userId: string; role: string }> } | null }
) {
  if (task.userId === user.id) return true;
  if (task.workspace) {
    return canManageWorkspace(user, task.workspace);
  }
  return false;
}

export function canViewTask(
  user: UserForPermissions,
  task: Task & { workspace?: Workspace & { members?: Array<{ userId: string; role: string }> } | null }
) {
  if (task.userId === user.id) return true;
  if (task.workspace) {
    const member = task.workspace.members?.find((m) => m.userId === user.id);
    return !!member || task.workspace.ownerId === user.id;
  }
  return false;
}
