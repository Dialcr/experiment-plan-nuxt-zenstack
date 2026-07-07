import { moveIssue, moveIssueSchema } from "../../../../../lib/issue";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const issueId = getRouterParam(event, "issueId")!;
  const body = await readBody(event);
  const data = moveIssueSchema.parse(body);
  return moveIssue(event, projectId, issueId, data);
});
