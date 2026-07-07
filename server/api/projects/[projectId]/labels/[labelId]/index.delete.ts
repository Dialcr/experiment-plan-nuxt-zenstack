import { deleteLabel } from "../../../../../lib/label";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const labelId = getRouterParam(event, "labelId")!;
  await deleteLabel(event, projectId, labelId);
  return { success: true };
});
