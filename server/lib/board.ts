import type { H3Event } from "h3";
import { getUserDb } from "./zenstack";
import { handleOrmError } from "./error";
import type {
  IssueListFilters,
  IssueResponse,
  UserView,
  LabelView,
} from "./issue";

type BoardIssue = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  sequence_id: number;
  sort_order: number;
  priority: string;
  state_id: string;
  project_id: string;
  sprint_id: string | null;
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

type BoardColumn = {
  id: string;
  name: string;
  slug: string;
  color: string;
  sequence: number;
  group: string;
  is_default: boolean;
  issues: BoardIssue[];
  issue_count: number;
};

export type BoardResponse = {
  columns: BoardColumn[];
};

function buildIssueFilters(projectId: string, filters: IssueListFilters) {
  const where: Record<string, unknown> = { project_id: projectId, archived_at: null };
  if (filters.state_id) where.state_id = filters.state_id;
  if (filters.priority) where.priority = filters.priority;
  if (filters.created_by_id) where.created_by_id = filters.created_by_id;
  if (filters.due_date) where.due_date = new Date(filters.due_date);
  if (filters.sprint_id) where.sprint_id = filters.sprint_id;
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

export async function getBoard(
  event: H3Event,
  projectId: string,
  filters: IssueListFilters = {},
): Promise<BoardResponse> {
  try {
    const db = await getUserDb(event);

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { identifier: true },
    });
    const identifier = project?.identifier ?? "";

    const states = await db.state.findMany({
      where: { project_id: projectId },
      orderBy: { sequence: "asc" },
    });

    const issueWhere = buildIssueFilters(projectId, filters);
    const issues = await db.issue.findMany({
      where: issueWhere as any,
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar_url: true },
            },
          },
        },
        labels: {
          include: { label: { select: { id: true, name: true, color: true } } },
        },
        created_by: {
          select: { id: true, name: true, email: true, avatar_url: true },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { sort_order: "asc" },
    });

    const stateMap = new Map<string, (typeof states)[0]>();
    for (const state of states) {
      stateMap.set(state.id, state);
    }

    const columns: BoardColumn[] = states.map((state) => ({
      id: state.id,
      name: state.name,
      slug: state.slug,
      color: state.color,
      sequence: state.sequence,
      group: state.group,
      is_default: state.is_default,
      issue_count: 0,
      issues: [],
    }));

    const columnMap = new Map(columns.map((c) => [c.id, c]));

    for (const issue of issues as any[]) {
      const col = columnMap.get(issue.state_id);
      if (!col) continue;

      const boardIssue: BoardIssue = {
        id: issue.id,
        key: `${identifier}-${issue.sequence_id}`,
        title: issue.title,
        description: issue.description ?? null,
        sequence_id: issue.sequence_id,
        sort_order: issue.sort_order,
        priority: issue.priority,
        state_id: issue.state_id,
        project_id: issue.project_id,
        sprint_id: issue.sprint_id ?? null,
        parent_id: issue.parent_id ?? null,
        start_date: issue.start_date?.toISOString() ?? null,
        due_date: issue.due_date?.toISOString() ?? null,
        completed_at: issue.completed_at?.toISOString() ?? null,
        assignees: (issue.assignees ?? []).map((a: any) => ({
          id: a.user.id,
          name: a.user.name,
          email: a.user.email,
          avatar_url: a.user.avatar_url ?? null,
        })),
        labels: (issue.labels ?? []).map((l: any) => ({
          id: l.label.id,
          name: l.label.name,
          color: l.label.color,
        })),
        comment_count: issue._count?.comments ?? 0,
        created_by: {
          id: issue.created_by.id,
          name: issue.created_by.name,
          email: issue.created_by.email,
          avatar_url: issue.created_by.avatar_url ?? null,
        },
        created_at: issue.created_at.toISOString(),
        updated_at: issue.updated_at.toISOString(),
      };
      col.issues.push(boardIssue);
    }

    for (const col of columns) {
      col.issue_count = col.issues.length;
    }

    return { columns };
  } catch (error) {
    return handleOrmError(error, "Failed to load board");
  }
}
