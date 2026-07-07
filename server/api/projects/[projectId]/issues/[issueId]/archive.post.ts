import { archiveIssue } from "../../../../../lib/issue";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const issueId = getRouterParam(event, "issueId")!;
  return archiveIssue(event, projectId, issueId);
});
