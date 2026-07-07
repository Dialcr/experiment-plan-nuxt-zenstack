import { createIssue, createIssueSchema } from "../../../../lib/issue";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const body = await readBody(event);
  const data = createIssueSchema.parse(body);
  return createIssue(event, projectId, data);
});
