import { createLabel, createLabelSchema } from "../../../../lib/label";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const body = await readBody(event);
  const data = createLabelSchema.parse(body);
  return createLabel(event, projectId, data);
});
