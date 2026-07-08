import { z } from "zod";
import type { H3Event } from "h3";
import { createError } from "h3";
import { getCurrentUser, getUserDb } from "./zenstack";
import { handleOrmError } from "./error";
import type { Issue } from "../../zenstack/models";

const priorityEnum = z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"]);

export const createIssueSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  state_id: z.string().min(1).optional(),
  priority: priorityEnum.optional().default("NONE"),
  sprint_id: z.string().min(1).optional().nullable(),
  label_ids: z.array(z.string().min(1)).optional(),
  assignee_ids: z.array(z.string().min(1)).optional(),
  start_date: z.string().datetime().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  parent_id: z.string().min(1).optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  state_id: z.string().min(1).optional(),
  priority: priorityEnum.optional(),
  sprint_id: z.string().min(1).optional().nullable(),
  label_ids: z.array(z.string().min(1)).optional(),
  assignee_ids: z.array(z.string().min(1)).optional(),
  start_date: z.string().datetime().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  parent_id: z.string().min(1).optional().nullable(),
});

export const moveIssueSchema = z.object({
  state_id: z.string().min(1, "Destination state is required"),
  sort_order: z.number().int().optional(),
});

export const updateAssigneesSchema = z.object({
  user_ids: z.array(z.string().min(1)),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type MoveIssueInput = z.infer<typeof moveIssueSchema>;
export type UpdateAssigneesInput = z.infer<typeof updateAssigneesSchema>;

export type UserView = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

export type LabelView = {
  id: string;
  name: string;
  color: string;
};

export type IssueResponse = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  sequence_id: number;
  sort_order: number;
  priority: string;
  state_id: string;
  sprint_id: string | null;
  project_id: string;
  parent_id: string | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  assignees: UserView[];
  labels: LabelView[];
  comment_count: number;
  created_by: UserView;
  created_at: string;
  updated_at: string;
};

export type IssueListFilters = {
  state_id?: string;
  assignee_id?: string;
  priority?: string;
  sprint_id?: string;
  search?: string;
  created_by_id?: string;
  due_date?: string;
};

function toUserView(user: {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}): UserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url ?? null,
  };
}

function toLabelView(label: {
  id: string;
  name: string;
  color: string;
}): LabelView {
  return { id: label.id, name: label.name, color: label.color };
}

type IssueWithRelations = Issue & {
  assignees: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      avatar_url: string | null;
    };
  }>;
  labels: Array<{ label: { id: string; name: string; color: string } }>;
  created_by: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  _count?: { comments: number };
  project?: { identifier: string };
};

function toResponse(
  issue: IssueWithRelations,
  projectIdentifier?: string,
): IssueResponse {
  const key = projectIdentifier
    ? `${projectIdentifier}-${issue.sequence_id}`
    : `${issue.sequence_id}`;
  return {
    id: issue.id,
    key,
    title: issue.title,
    description: issue.description ?? null,
    sequence_id: issue.sequence_id,
    sort_order: issue.sort_order,
    priority: issue.priority,
    state_id: issue.state_id,
    sprint_id: issue.sprint_id ?? null,
    project_id: issue.project_id,
    parent_id: issue.parent_id ?? null,
    start_date: issue.start_date?.toISOString() ?? null,
    due_date: issue.due_date?.toISOString() ?? null,
    completed_at: issue.completed_at?.toISOString() ?? null,
    assignees: (issue.assignees ?? []).map((a) => toUserView(a.user)),
    labels: (issue.labels ?? []).map((l) => toLabelView(l.label)),
    comment_count: issue._count?.comments ?? 0,
    created_by: toUserView(issue.created_by),
    created_at: issue.created_at.toISOString(),
    updated_at: issue.updated_at.toISOString(),
  };
}

function buildIssueFilters(projectId: string, filters: IssueListFilters) {
  const where: Record<string, unknown> = {
    project_id: projectId,
    archived_at: null,
  };
  if (filters.state_id) where.state_id = filters.state_id;
  if (filters.priority) where.priority = filters.priority;
  if (filters.created_by_id) where.created_by_id = filters.created_by_id;
  // Handle sprint_id filter - "null" string means issues without sprint
  if (filters.sprint_id !== undefined) {
    where.sprint_id = filters.sprint_id === "null" ? null : filters.sprint_id;
  }
  if (filters.due_date) where.due_date = new Date(filters.due_date);
  if (filters.assignee_id) {
    where.assignees = { some: { user_id: filters.assignee_id } };
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  return where;
}

const issueInclude = {
  assignees: {
    include: {
      user: { select: { id: true, name: true, email: true, avatar_url: true } },
    },
  },
  labels: {
    include: { label: { select: { id: true, name: true, color: true } } },
  },
  created_by: {
    select: { id: true, name: true, email: true, avatar_url: true },
  },
  _count: { select: { comments: true } },
} as const;

async function loadProjectIdentifier(
  event: H3Event,
  projectId: string,
): Promise<string> {
  const db = await getUserDb(event);
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { identifier: true },
  });
  return project?.identifier ?? "";
}

export async function listIssues(
  event: H3Event,
  projectId: string,
  filters: IssueListFilters = {},
): Promise<IssueResponse[]> {
  try {
    const db = await getUserDb(event);
    const identifier = await loadProjectIdentifier(event, projectId);
    const where = buildIssueFilters(projectId, filters);
    const issues = await db.issue.findMany({
      where: where as any,
      include: issueInclude as any,
      orderBy: { sort_order: "asc" },
    });
    return issues.map((i: any) =>
      toResponse(i as IssueWithRelations, identifier),
    );
  } catch (error) {
    return handleOrmError(error, "Failed to list issues");
  }
}

export async function getIssue(
  event: H3Event,
  projectId: string,
  issueId: string,
): Promise<IssueResponse> {
  try {
    const db = await getUserDb(event);
    const identifier = await loadProjectIdentifier(event, projectId);
    const issue = await db.issue.findUniqueOrThrow({
      where: { id: issueId },
      include: issueInclude as any,
    });
    return toResponse(issue as any, identifier);
  } catch (error) {
    return handleOrmError(error, "Failed to get issue");
  }
}

export async function createIssue(
  event: H3Event,
  projectId: string,
  data: CreateIssueInput,
): Promise<IssueResponse> {
  try {
    const user = await getCurrentUser(event);
    const db = await getUserDb(event);

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { identifier: true, default_state_id: true },
    });
    if (!project)
      throw createError({
        statusCode: 404,
        statusMessage: "Project not found",
      });

    const stateId = data.state_id || project.default_state_id;
    if (!stateId)
      throw createError({
        statusCode: 422,
        statusMessage: "No default state configured for this project",
      });

    if (data.label_ids?.length) {
      const count = await db.label.count({
        where: { id: { in: data.label_ids }, project_id: projectId },
      });
      if (count !== data.label_ids.length) {
        throw createError({
          statusCode: 422,
          statusMessage: "One or more labels do not belong to this project",
        });
      }
    }

    if (data.assignee_ids?.length) {
      const count = await db.projectMember.count({
        where: {
          project_id: projectId,
          user_id: { in: data.assignee_ids },
          is_active: true,
        },
      });
      if (count !== data.assignee_ids.length) {
        throw createError({
          statusCode: 422,
          statusMessage:
            "One or more assignees are not active members of this project",
        });
      }
    }

    const lastIssue = await db.issue.findFirst({
      where: { project_id: projectId },
      orderBy: { sequence_id: "desc" },
      select: { sequence_id: true },
    });
    const nextSeq = (lastIssue?.sequence_id ?? 0) + 1;

    const lastSort = await db.issue.findFirst({
      where: { project_id: projectId, state_id: stateId },
      orderBy: { sort_order: "desc" },
      select: { sort_order: true },
    });
    const nextSort = (lastSort?.sort_order ?? 0) + 10000;

    const issue = await db.issue.create({
      data: {
        project_id: projectId,
        state_id: stateId,
        title: data.title,
        sprint_id: data.sprint_id ?? null,
        description: data.description ?? null,
        priority: data.priority ?? "NONE",
        sequence_id: nextSeq,
        sort_order: nextSort,
        start_date: data.start_date ? new Date(data.start_date) : null,
        due_date: data.due_date ? new Date(data.due_date) : null,
        parent_id: data.parent_id ?? null,
        created_by_id: user.id,
        updated_by_id: user.id,
        assignees: data.assignee_ids?.length
          ? { create: data.assignee_ids.map((uid) => ({ user_id: uid })) }
          : undefined,
        labels: data.label_ids?.length
          ? { create: data.label_ids.map((lid) => ({ label_id: lid })) }
          : undefined,
      },
      include: issueInclude as any,
    });

    return toResponse(issue as any, project.identifier);
  } catch (error) {
    return handleOrmError(error, "Failed to create issue");
  }
}

export async function updateIssue(
  event: H3Event,
  projectId: string,
  issueId: string,
  data: UpdateIssueInput,
): Promise<IssueResponse> {
  try {
    const user = await getCurrentUser(event);
    const db = await getUserDb(event);

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { identifier: true },
    });
    if (!project)
      throw createError({
        statusCode: 404,
        statusMessage: "Project not found",
      });

    if (data.label_ids) {
      if (data.label_ids.length > 0) {
        const count = await db.label.count({
          where: { id: { in: data.label_ids }, project_id: projectId },
        });
        if (count !== data.label_ids.length) {
          throw createError({
            statusCode: 422,
            statusMessage: "One or more labels do not belong to this project",
          });
        }
      }
    }

    if (data.assignee_ids) {
      if (data.assignee_ids.length > 0) {
        const count = await db.projectMember.count({
          where: {
            project_id: projectId,
            user_id: { in: data.assignee_ids },
            is_active: true,
          },
        });
        if (count !== data.assignee_ids.length) {
          throw createError({
            statusCode: 422,
            statusMessage:
              "One or more assignees are not active members of this project",
          });
        }
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.state_id !== undefined) updateData.state_id = data.state_id;
    if (data.sprint_id !== undefined) updateData.sprint_id = data.sprint_id;
    if (data.start_date !== undefined)
      updateData.start_date = data.start_date
        ? new Date(data.start_date)
        : null;
    if (data.due_date !== undefined)
      updateData.due_date = data.due_date ? new Date(data.due_date) : null;
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id;
    updateData.updated_by_id = user.id;

    const issue = await db.$transaction(async (tx: any) => {
      if (data.state_id) {
        const state = await tx.state.findUnique({
          where: { id: data.state_id },
          select: { group: true, project_id: true },
        });
        if (!state || state.project_id !== projectId) {
          throw createError({
            statusCode: 422,
            statusMessage: "Destination state not found in this project",
          });
        }
        updateData.completed_at =
          state.group === "COMPLETED" ? new Date() : null;
      }

      if (data.assignee_ids) {
        await tx.issueAssignee.deleteMany({ where: { issue_id: issueId } });
        if (data.assignee_ids.length > 0) {
          await tx.issueAssignee.createMany({
            data: data.assignee_ids.map((uid) => ({
              issue_id: issueId,
              user_id: uid,
            })),
          });
        }
      }

      if (data.label_ids) {
        await tx.issueLabel.deleteMany({ where: { issue_id: issueId } });
        if (data.label_ids.length > 0) {
          await tx.issueLabel.createMany({
            data: data.label_ids.map((lid) => ({
              issue_id: issueId,
              label_id: lid,
            })),
          });
        }
      }

      return tx.issue.update({
        where: { id: issueId },
        data: updateData,
        include: issueInclude as any,
      });
    });

    return toResponse(issue as any, project.identifier);
  } catch (error) {
    return handleOrmError(error, "Failed to update issue");
  }
}

export async function deleteIssue(
  event: H3Event,
  projectId: string,
  issueId: string,
): Promise<void> {
  try {
    const db = await getUserDb(event);
    await db.issue.delete({ where: { id: issueId } });
  } catch (error) {
    return handleOrmError(error, "Failed to delete issue");
  }
}

export async function archiveIssue(
  event: H3Event,
  projectId: string,
  issueId: string,
): Promise<IssueResponse> {
  try {
    const user = await getCurrentUser(event);
    const db = await getUserDb(event);
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { identifier: true },
    });
    if (!project)
      throw createError({
        statusCode: 404,
        statusMessage: "Project not found",
      });
    const issue = await db.issue.update({
      where: { id: issueId },
      data: {
        archived_at: new Date(),
        updated_by_id: user.id,
      },
      include: issueInclude as any,
    });
    return toResponse(issue as any, project.identifier);
  } catch (error) {
    return handleOrmError(error, "Failed to archive issue");
  }
}

export async function moveIssue(
  event: H3Event,
  projectId: string,
  issueId: string,
  data: MoveIssueInput,
): Promise<IssueResponse> {
  try {
    const user = await getCurrentUser(event);
    const db = await getUserDb(event);

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { identifier: true },
    });
    if (!project)
      throw createError({
        statusCode: 404,
        statusMessage: "Project not found",
      });

    const state = await db.state.findUnique({
      where: { id: data.state_id },
      select: { project_id: true, group: true },
    });
    if (!state || state.project_id !== projectId) {
      throw createError({
        statusCode: 422,
        statusMessage: "Destination state not found in this project",
      });
    }

    const issue = await db.issue.update({
      where: { id: issueId },
      data: {
        state_id: data.state_id,
        sort_order: data.sort_order ?? 0,
        completed_at: state.group === "COMPLETED" ? new Date() : null,
        updated_by_id: user.id,
      },
      include: issueInclude as any,
    });

    return toResponse(issue as any, project.identifier);
  } catch (error) {
    return handleOrmError(error, "Failed to move issue");
  }
}

export async function updateAssignees(
  event: H3Event,
  projectId: string,
  issueId: string,
  data: UpdateAssigneesInput,
): Promise<IssueResponse> {
  try {
    const user = await getCurrentUser(event);
    const db = await getUserDb(event);

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { identifier: true },
    });
    if (!project)
      throw createError({
        statusCode: 404,
        statusMessage: "Project not found",
      });

    const membership = await db.projectMember.findUnique({
      where: {
        project_id_user_id: { project_id: projectId, user_id: user.id },
      },
      select: { role: true },
    });
    if (!membership || membership.role === "VIEWER") {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied",
      });
    }

    if (data.user_ids.length > 0) {
      const count = await db.projectMember.count({
        where: {
          project_id: projectId,
          user_id: { in: data.user_ids },
          is_active: true,
        },
      });
      if (count !== data.user_ids.length) {
        throw createError({
          statusCode: 422,
          statusMessage:
            "One or more users are not active members of this project",
        });
      }
    }

    const issue = await db.$transaction(async (tx: any) => {
      await tx.issueAssignee.deleteMany({ where: { issue_id: issueId } });
      if (data.user_ids.length > 0) {
        await tx.issueAssignee.createMany({
          data: data.user_ids.map((uid) => ({
            issue_id: issueId,
            user_id: uid,
          })),
        });
      }
      return tx.issue.findUniqueOrThrow({
        where: { id: issueId },
        include: issueInclude as any,
      });
    });

    return toResponse(issue as any, project.identifier);
  } catch (error) {
    return handleOrmError(error, "Failed to update assignees");
  }
}
