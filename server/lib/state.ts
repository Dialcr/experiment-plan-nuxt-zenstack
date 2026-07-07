import { z } from "zod";
import type { H3Event } from "h3";
import { createError } from "h3";
import { getUserDb } from "./zenstack";
import { handleOrmError } from "./error";
import type { State } from "../../zenstack/models";

const stateGroupEnum = z.enum([
  "BACKLOG",
  "UNSTARTED",
  "STARTED",
  "COMPLETED",
  "CANCELLED",
]);

export const createStateSchema = z.object({
  name: z.string().trim().min(1, "State name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores"),
  color: z.string().trim().min(1, "Color is required"),
  group: stateGroupEnum,
});

export const updateStateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  color: z.string().trim().min(1).optional(),
  group: stateGroupEnum.optional(),
});

export const reorderStatesSchema = z.object({
  state_ids: z
    .array(z.string().min(1))
    .min(1, "At least one state ID is required"),
});

export type CreateStateInput = z.infer<typeof createStateSchema>;
export type UpdateStateInput = z.infer<typeof updateStateSchema>;
export type ReorderStatesInput = z.infer<typeof reorderStatesSchema>;

export type StateResponse = {
  id: string;
  name: string;
  slug: string;
  color: string;
  sequence: number;
  group: string;
  is_default: boolean;
  issue_count?: number;
};

function toResponse(state: State): StateResponse {
  return {
    id: state.id,
    name: state.name,
    slug: state.slug,
    color: state.color,
    sequence: state.sequence,
    group: state.group,
    is_default: state.is_default,
  };
}

export async function listStates(
  event: H3Event,
  projectId: string,
): Promise<StateResponse[]> {
  try {
    const db = await getUserDb(event);
    const states = await db.state.findMany({
      where: { project_id: projectId },
      orderBy: { sequence: "asc" },
    });
    return states.map(toResponse);
  } catch (error) {
    return handleOrmError(error, "Failed to list states");
  }
}

export async function createState(
  event: H3Event,
  projectId: string,
  data: CreateStateInput,
): Promise<StateResponse> {
  try {
    const db = await getUserDb(event);
    const lastState = await db.state.findFirst({
      where: { project_id: projectId },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });
    const nextSequence = (lastState?.sequence ?? 0) + 10000;
    const state = await db.state.create({
      data: {
        project_id: projectId,
        name: data.name,
        slug: data.slug,
        color: data.color,
        group: data.group,
        sequence: nextSequence,
      },
    });
    return toResponse(state);
  } catch (error) {
    return handleOrmError(error, "Failed to create state");
  }
}

export async function updateState(
  event: H3Event,
  projectId: string,
  stateId: string,
  data: UpdateStateInput,
): Promise<StateResponse> {
  try {
    const db = await getUserDb(event);
    const state = await db.state.update({
      where: { id: stateId, project_id: projectId },
      data,
    });
    return toResponse(state);
  } catch (error) {
    return handleOrmError(error, "Failed to update state");
  }
}

export async function deleteState(
  event: H3Event,
  projectId: string,
  stateId: string,
): Promise<void> {
  try {
    const db = await getUserDb(event);
    const state = await db.state.findUnique({
      where: { id: stateId },
      select: {
        id: true,
        is_default: true,
        project_id: true,
        _count: { select: { issues: true } },
      },
    });
    if (!state || state.project_id !== projectId) {
      throw createError({ statusCode: 404, statusMessage: "State not found" });
    }
    if (state.is_default) {
      throw createError({
        statusCode: 422,
        statusMessage: "Cannot delete the default state",
      });
    }
    if (state._count.issues > 0) {
      throw createError({
        statusCode: 422,
        statusMessage: "Cannot delete a state that contains issues",
      });
    }
    await db.state.delete({ where: { id: stateId } });
  } catch (error) {
    return handleOrmError(error, "Failed to delete state");
  }
}

export async function reorderStates(
  event: H3Event,
  projectId: string,
  data: ReorderStatesInput,
): Promise<StateResponse[]> {
  try {
    const db = await getUserDb(event);
    const states = await db.state.findMany({
      where: { project_id: projectId },
      orderBy: { sequence: "asc" },
    });
    const stateMap = new Map(states.map((s) => [s.id, s]));
    const ordered = data.state_ids
      .map((id) => stateMap.get(id))
      .filter(Boolean) as State[];
    if (ordered.length !== states.length) {
      throw createError({
        statusCode: 422,
        statusMessage: "State list does not match project states",
      });
    }
    await db.$transaction(
      ordered.map((state, index) =>
        db.state.update({
          where: { id: state.id },
          data: { sequence: (index + 1) * 10000 },
        }),
      ),
    );
    const updated = await db.state.findMany({
      where: { project_id: projectId },
      orderBy: { sequence: "asc" },
    });
    return updated.map(toResponse);
  } catch (error) {
    return handleOrmError(error, "Failed to reorder states");
  }
}

export async function setDefaultState(
  event: H3Event,
  projectId: string,
  stateId: string,
): Promise<StateResponse> {
  try {
    const db = await getUserDb(event);
    const state = await db.state.findUnique({
      where: { id: stateId },
      select: { id: true, project_id: true },
    });
    if (!state || state.project_id !== projectId) {
      throw createError({ statusCode: 404, statusMessage: "State not found" });
    }
    await db.$transaction([
      db.state.updateMany({
        where: { project_id: projectId, is_default: true },
        data: { is_default: false },
      }),
      db.state.update({
        where: { id: stateId },
        data: { is_default: true },
      }),
      db.project.update({
        where: { id: projectId },
        data: { default_state_id: stateId },
      }),
    ]);
    const updated = await db.state.findUniqueOrThrow({
      where: { id: stateId },
    });
    return toResponse(updated);
  } catch (error) {
    return handleOrmError(error, "Failed to set default state");
  }
}

export async function listStatesWithIssueCount(
  event: H3Event,
  projectId: string,
): Promise<StateResponse[]> {
  try {
    const db = await getUserDb(event);
    const states = await db.state.findMany({
      where: { project_id: projectId },
      orderBy: { sequence: "asc" },
      include: { _count: { select: { issues: true } } },
    });
    return states.map((s) => ({
      ...toResponse(s),
      issue_count: s._count.issues,
    }));
  } catch (error) {
    return handleOrmError(error, "Failed to list states");
  }
}
