import { z } from "zod";
import type { H3Event } from "h3";
import { createError } from "h3";
import { getCurrentUser, getUserDb } from "./zenstack";
import { handleOrmError } from "./error";
import type { Sprint } from "../zenstack/models";

export const createSprintSchema = z.object({
  name: z.string().trim().min(1, "Sprint name is required"),
  description: z.string().trim().optional(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
});

export const updateSprintSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED"]).optional(),
});

export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;

export type SprintResponse = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  issue_count: number;
  created_at: string;
  updated_at: string;
};

function toResponse(sprint: Sprint & { _count?: { issues: number } }): SprintResponse {
  return {
    id: sprint.id,
    name: sprint.name,
    description: sprint.description ?? null,
    status: sprint.status,
    start_date: sprint.start_date?.toISOString() ?? null,
    end_date: sprint.end_date?.toISOString() ?? null,
    issue_count: sprint._count?.issues ?? 0,
    created_at: sprint.created_at.toISOString(),
    updated_at: sprint.updated_at.toISOString(),
  };
}

export async function listSprints(event: H3Event, projectId: string): Promise<SprintResponse[]> {
  try {
    const db = await getUserDb(event);
    const sprints = await db.sprint.findMany({
      where: { project_id: projectId },
      include: { _count: { select: { issues: true } } },
      orderBy: { created_at: "desc" },
    });
    return sprints.map(toResponse);
  } catch (error) {
    return handleOrmError(error, "Failed to list sprints");
  }
}

export async function getSprint(event: H3Event, projectId: string, sprintId: string): Promise<SprintResponse> {
  try {
    const db = await getUserDb(event);
    const sprint = await db.sprint.findUniqueOrThrow({
      where: { id: sprintId },
      include: { _count: { select: { issues: true } } },
    });
    return toResponse(sprint);
  } catch (error) {
    return handleOrmError(error, "Failed to get sprint");
  }
}

export async function createSprint(event: H3Event, projectId: string, data: CreateSprintInput): Promise<SprintResponse> {
  try {
    const db = await getUserDb(event);
    const user = await getCurrentUser(event);
    const sprint = await db.sprint.create({
      data: {
        project_id: projectId,
        owner_id: user.id,
        name: data.name,
        description: data.description ?? null,
        start_date: data.start_date ? new Date(data.start_date) : null,
        end_date: data.end_date ? new Date(data.end_date) : null,
      },
      include: { _count: { select: { issues: true } } },
    });
    return toResponse(sprint);
  } catch (error) {
    return handleOrmError(error, "Failed to create sprint");
  }
}

export async function updateSprint(event: H3Event, projectId: string, sprintId: string, data: UpdateSprintInput): Promise<SprintResponse> {
  try {
    const db = await getUserDb(event);
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.start_date !== undefined) updateData.start_date = data.start_date ? new Date(data.start_date) : null;
    if (data.end_date !== undefined) updateData.end_date = data.end_date ? new Date(data.end_date) : null;
    const sprint = await db.sprint.update({
      where: { id: sprintId },
      data: updateData,
      include: { _count: { select: { issues: true } } },
    });
    return toResponse(sprint);
  } catch (error) {
    return handleOrmError(error, "Failed to update sprint");
  }
}

export async function deleteSprint(event: H3Event, projectId: string, sprintId: string): Promise<void> {
  try {
    const db = await getUserDb(event);
    await db.sprint.delete({ where: { id: sprintId } });
  } catch (error) {
    return handleOrmError(error, "Failed to delete sprint");
  }
}
