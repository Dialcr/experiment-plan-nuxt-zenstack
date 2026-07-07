import { updateIssue, updateIssueSchema } from "../../../../../lib/issue";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const issueId = getRouterParam(event, "issueId")!;
  const body = await readBody(event);
  const data = updateIssueSchema.parse(body);
  return updateIssue(event, projectId, issueId, data);
});
