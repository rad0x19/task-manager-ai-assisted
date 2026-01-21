import { z } from 'zod';

export const TaskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: TaskPriorityEnum.default('MEDIUM'),
  workspaceId: z.string().uuid().optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  workspaceId: z.string().uuid().nullable().optional(),
});

export const TaskResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  workspaceId: z.string().uuid().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum,
  category: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  metadata: z.record(z.any()).nullable(),
  dueDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  lastSyncedAt: z.string().datetime().nullable().optional(),
  version: z.number().int().optional(),
  recurringRule: z.record(z.any()).nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Chat Schemas
export const ChatMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1).max(2000),
});

export const PlanProposalSchema = z.object({
  summary: z.string(),
  tasks: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    priority: TaskPriorityEnum.default('MEDIUM'),
    dueDate: z.string().datetime().nullable().optional(),
  })),
  habits: z.array(z.object({
    name: z.string().min(1).max(100),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    goal: z.string().max(500).optional(),
  })),
});

export const ApprovePlanSchema = z.object({
  conversationId: z.string().uuid(),
  workspaceId: z.string().uuid().optional(),
});

export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskResponse = z.infer<typeof TaskResponseSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type PlanProposal = z.infer<typeof PlanProposalSchema>;
export type ApprovePlanInput = z.infer<typeof ApprovePlanSchema>;
