import { getIssue } from "../../../../../lib/issue";

export default defineEventHandler((event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const issueId = getRouterParam(event, "issueId")!;
  return getIssue(event, projectId, issueId);
});
