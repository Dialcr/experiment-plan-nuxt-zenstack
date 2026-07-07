import { z } from "zod";
import type { H3Event } from "h3";
import { ORMError } from "@zenstackhq/orm";
import { createError } from "h3";
import { getCurrentUser, getUserDb, policyDb } from "./zenstack";
import type { Project } from "../../zenstack/models";

const DEFAULT_STATES = [
  {
    name: "Backlog",
    slug: "backlog",
    color: "#d9d9d9",
    group: "BACKLOG" as const,
    sequence: 10000,
    is_default: false,
  },
  {
    name: "Todo",
    slug: "todo",
    color: "#3b82f6",
    group: "UNSTARTED" as const,
    sequence: 20000,
    is_default: true,
  },
  {
    name: "In Progress",
    slug: "in_progress",
    color: "#f59e0b",
    group: "STARTED" as const,
    sequence: 30000,
    is_default: false,
  },
  {
    name: "Done",
    slug: "done",
    color: "#22c55e",
    group: "COMPLETED" as const,
    sequence: 40000,
    is_default: false,
  },
  {
    name: "Cancelled",
    slug: "cancelled",
    color: "#ef4444",
    group: "CANCELLED" as const,
    sequence: 50000,
    is_default: false,
  },
];

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  identifier: z
    .string()
    .trim()
    .min(2, "Identifier must be at least 2 characters")
    .max(10, "Identifier must be at most 10 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens, or underscores"),
  description: z.string().trim().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").optional(),
  description: z.string().trim().optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export type ProjectResponse = {
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
};

function toResponse(project: Project): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    identifier: project.identifier,
    description: project.description ?? null,
    created_at: project.created_at,
    updated_at: project.updated_at,
  };
}

function handleOrmError(error: unknown, fallbackMessage: string): never {
  if (error && typeof error === "object" && "statusCode" in error) {
    throw error;
  }
  if (error instanceof ORMError) {
    if (error.reason === "REJECTED_BY_POLICY") {
      throw createError({
        statusCode: 403,
        statusMessage: error.rejectedByPolicyReason ?? "Access denied",
      });
    }
    if (error.reason === "NOT_FOUND") {
      throw createError({
        statusCode: 404,
        statusMessage: "Project not found",
      });
    }
    if (error.reason === "INVALID_INPUT") {
      throw createError({
        statusCode: 400,
        statusMessage: error.dbErrorMessage ?? "Invalid input",
      });
    }
  }
  throw createError({ statusCode: 500, statusMessage: fallbackMessage });
}

export async function listProjects(event: H3Event): Promise<ProjectResponse[]> {
  try {
    const db = await getUserDb(event);
    const projects = await db.project.findMany({
      where: { archived_at: null },
      orderBy: { created_at: "desc" },
    });
    return projects.map(toResponse);
  } catch (error) {
    return handleOrmError(error, "Failed to list projects");
  }
}

export async function getProject(
  event: H3Event,
  projectId: string,
): Promise<ProjectResponse> {
  try {
    const db = await getUserDb(event);
    const project = await db.project.findUniqueOrThrow({
      where: { id: projectId },
    });
    return toResponse(project);
  } catch (error) {
    return handleOrmError(error, "Failed to get project");
  }
}

export async function createProject(
  event: H3Event,
  data: CreateProjectInput,
): Promise<ProjectResponse> {
  try {
    const user = await getCurrentUser(event);
    const db = policyDb.$setAuth(user);

    const project = await db.project.create({
      data: {
        name: data.name,
        identifier: data.identifier.toUpperCase(),
        description: data.description ?? null,
        created_by_id: user.id,
        lead_id: user.id,
      },
    });

    await db.projectMember.create({
      data: {
        project_id: project.id,
        user_id: user.id,
        role: "ADMIN",
      },
    });

    const states = await Promise.all(
      DEFAULT_STATES.map((s) =>
        db.state.create({
          data: { ...s, project_id: project.id },
        }),
      ),
    );

    const defaultState = states.find((s) => s.is_default);
    if (defaultState) {
      await db.project.update({
        where: { id: project.id },
        data: { default_state_id: defaultState.id },
      });
    }

    const created = await db.project.findUniqueOrThrow({
      where: { id: project.id },
    });

    return toResponse(created);
  } catch (error) {
    return handleOrmError(error, "Failed to create project");
  }
}

export async function updateProject(
  event: H3Event,
  projectId: string,
  data: UpdateProjectInput,
): Promise<ProjectResponse> {
  try {
    const db = await getUserDb(event);
    const project = await db.project.update({
      where: { id: projectId },
      data,
    });
    return toResponse(project);
  } catch (error) {
    return handleOrmError(error, "Failed to update project");
  }
}

export async function deleteProject(
  event: H3Event,
  projectId: string,
): Promise<void> {
  try {
    const db = await getUserDb(event);
    await db.project.delete({
      where: { id: projectId },
    });
  } catch (error) {
    return handleOrmError(error, "Failed to delete project");
  }
}
