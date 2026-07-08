import {
  updateAssignees,
  updateAssigneesSchema,
} from "../../../../../lib/issue";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const issueId = getRouterParam(event, "issueId")!;
  const body = await readBody(event);
  const data = updateAssigneesSchema.parse(body);
  return updateAssignees(event, projectId, issueId, data);
});
