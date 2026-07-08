import { updateLabel, updateLabelSchema } from "../../../../lib/label";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const labelId = getRouterParam(event, "labelId")!;
  const body = await readBody(event);
  const data = updateLabelSchema.parse(body);
  return updateLabel(event, projectId, labelId, data);
});
