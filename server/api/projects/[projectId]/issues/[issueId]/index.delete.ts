import { deleteIssue } from "../../../../../lib/issue";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const issueId = getRouterParam(event, "issueId")!;
  await deleteIssue(event, projectId, issueId);
  return { success: true };
});
