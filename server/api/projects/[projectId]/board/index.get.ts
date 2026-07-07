import { getBoard } from "../../../../lib/board";

export default defineEventHandler((event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const query = getQuery(event) as Record<string, string | undefined>;
  const filters = {
    state_id: query.state_id,
    assignee_id: query.assignee_id,
    priority: query.priority,
    search: query.search,
    created_by_id: query.created_by_id,
    due_date: query.due_date,
  };
  return getBoard(event, projectId, filters);
});
