import { createProject, createProjectSchema } from "../../lib/project";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const data = createProjectSchema.parse(body);
  return createProject(event, data);
});
